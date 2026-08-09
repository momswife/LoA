import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { parse as parseYaml } from "yaml"

const repoRoot = process.cwd()
const contentRoot = path.join(repoRoot, "content")
const vaultRoot = path.join(contentRoot, "Aerathon - Eternal Labyrinths")
const allowlistPath = path.join(repoRoot, "wiki-link-allowlist.json")

const toPosix = (value) => value.split(path.sep).join("/")
const knownExtensionPattern = /\.(?:md|png|jpe?g|webp|gif|svg|ya?ml|pdf|canvas|base)$/iu
const withoutExtension = (value) => value.replace(knownExtensionPattern, "")
const normalizeName = (value) =>
  value
    .normalize("NFKC")
    .replace(/[‘’]/gu, "'")
    .replace(/[“”]/gu, '"')
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("en-US")

const stripHeadingMarkup = (value) =>
  value
    .replace(/\s+#+\s*$/u, "")
    .replace(/\*\*|__|\*|_|`/gu, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/gu, "$1")
    .trim()

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.name === ".obsidian") continue
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(absolute)))
    else files.push(absolute)
  }

  return files
}

function addToMap(map, key, record) {
  if (!key) return
  const normalized = normalizeName(key)
  const values = map.get(normalized) ?? []
  values.push(record)
  map.set(normalized, values)
}

function parseFrontmatter(text, relativePath) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u)
  if (!match) return { body: text, data: {}, error: null }

  try {
    return {
      body: text.slice(match[0].length),
      data: parseYaml(match[1]) ?? {},
      error: null,
    }
  } catch (error) {
    return {
      body: text.slice(match[0].length),
      data: {},
      error: `${relativePath}: ${error.message}`,
    }
  }
}

function maskNonContent(text) {
  return text
    .replace(/```[\s\S]*?```/gu, (match) => match.replace(/[^\n]/gu, " "))
    .replace(/%%[\s\S]*?%%/gu, (match) => match.replace(/[^\n]/gu, " "))
}

function lineNumberAt(text, offset) {
  return text.slice(0, offset).split("\n").length
}

function uniqueRecords(records) {
  return [...new Map(records.map((record) => [record.absolute, record])).values()]
}

function splitWikiTarget(rawTarget) {
  const unescaped = rawTarget.replace(/\\\|/gu, "|").replace(/\\#/gu, "#")
  const visibleSeparator = unescaped.indexOf("|")
  const address = (visibleSeparator === -1 ? unescaped : unescaped.slice(0, visibleSeparator)).trim()
  const headingAt = address.indexOf("#")

  if (headingAt === -1) return { target: address, heading: "" }
  return {
    target: address.slice(0, headingAt).trim(),
    heading: address.slice(headingAt + 1).split("^")[0].trim(),
  }
}

function possibleFileKeys(target) {
  const clean = target.replace(/^\.\//u, "").replace(/^\//u, "").replace(/\\/gu, "/")
  if (knownExtensionPattern.test(clean)) return [clean]
  return [clean, `${clean}.md`, `${clean}/index.md`, `${clean}/Overview.md`]
}

function resolveWikiTarget(source, rawTarget, indexes) {
  const { target, heading } = splitWikiTarget(rawTarget)
  if (!target) return { records: [source], heading }
  if (/^[a-z][a-z0-9+.-]*:/iu.test(target)) return { records: [], heading, external: true }

  let decoded = target
  try {
    decoded = decodeURIComponent(target)
  } catch {
    // Obsidian permits literal percent characters in filenames.
  }

  const keys = possibleFileKeys(decoded)
  const matches = []

  for (const key of keys) {
    const normalizedKey = normalizeName(key)
    matches.push(...(indexes.byContentPath.get(normalizedKey) ?? []))
    matches.push(...(indexes.byVaultPath.get(normalizedKey) ?? []))

    const sourceRelative = toPosix(
      path.relative(vaultRoot, path.resolve(path.dirname(source.absolute), key)),
    )
    matches.push(...(indexes.byVaultPath.get(normalizeName(sourceRelative)) ?? []))

    if (key.includes("/")) {
      for (const record of indexes.records) {
        if (normalizeName(record.vaultRelative).endsWith(`/${normalizedKey}`)) matches.push(record)
      }
    }
  }

  if (!decoded.includes("/")) {
    const baseKey = normalizeName(withoutExtension(decoded))
    matches.push(...(indexes.byBasename.get(baseKey) ?? []) )
    matches.push(...(indexes.byName.get(baseKey) ?? []) )
  }

  return { records: uniqueRecords(matches), heading }
}

function hasHeading(record, heading) {
  if (!heading) return true
  const expected = normalizeName(heading)
  return record.headings.some((candidate) => normalizeName(candidate) === expected)
}

async function loadAllowlist() {
  try {
    const text = await fs.readFile(allowlistPath, "utf8")
    const parsed = JSON.parse(text)
    return new Set((parsed.unwrittenWikiLinks ?? []).map(normalizeName))
  } catch (error) {
    if (error.code === "ENOENT") return new Set()
    throw error
  }
}

function isStringOrStringList(value) {
  return (
    typeof value === "string" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  )
}

const allAbsoluteFiles = await walk(vaultRoot)
const markdownFiles = allAbsoluteFiles.filter((file) => path.extname(file).toLowerCase() === ".md")
const allowlistedLinks = await loadAllowlist()
const records = []
const errors = []
const warnings = []
const usedAllowlistedLinks = new Set()

for (const absolute of allAbsoluteFiles) {
  const contentRelative = toPosix(path.relative(contentRoot, absolute))
  const vaultRelative = toPosix(path.relative(vaultRoot, absolute))
  const extension = path.extname(absolute).toLowerCase()
  const record = {
    absolute,
    contentRelative,
    vaultRelative,
    basename: path.basename(absolute, extension),
    extension,
    title: "",
    aliases: [],
    headings: [],
    body: "",
    scanBody: "",
    frontmatter: {},
  }

  if (/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/u.test(path.basename(absolute))) {
    errors.push(`Hidden Unicode character in filename: ${vaultRelative}`)
  }

  if (extension === ".md") {
    const text = await fs.readFile(absolute, "utf8")
    if (/\uFFFD|(?:â€|Ã.|Â[^\s])/u.test(text)) {
      errors.push(`Suspicious text encoding: ${vaultRelative}`)
    }
    const frontmatter = parseFrontmatter(text, vaultRelative)
    if (frontmatter.error) errors.push(`Invalid frontmatter: ${frontmatter.error}`)

    const metadata = frontmatter.data
    if ("title" in metadata && typeof metadata.title !== "string") {
      errors.push(`Invalid frontmatter type: ${vaultRelative} -> title must be a string`)
    }
    if ("aliases" in metadata && !isStringOrStringList(metadata.aliases)) {
      errors.push(`Invalid frontmatter type: ${vaultRelative} -> aliases must be a string or string list`)
    }
    if ("tags" in metadata && !isStringOrStringList(metadata.tags)) {
      errors.push(`Invalid frontmatter type: ${vaultRelative} -> tags must be a string or string list`)
    }
    if ("draft" in metadata && typeof metadata.draft !== "boolean") {
      errors.push(`Invalid frontmatter type: ${vaultRelative} -> draft must be a boolean`)
    }
    if ("summary" in metadata && typeof metadata.summary !== "string") {
      errors.push(`Invalid frontmatter type: ${vaultRelative} -> summary must be a string`)
    }
    if (
      "facts" in metadata &&
      (typeof metadata.facts !== "object" || metadata.facts === null || Array.isArray(metadata.facts))
    ) {
      errors.push(`Invalid frontmatter type: ${vaultRelative} -> facts must be a mapping`)
    }

    record.frontmatter = frontmatter.data
    record.body = frontmatter.body
    record.scanBody = maskNonContent(frontmatter.body)
    record.title = typeof frontmatter.data.title === "string" ? frontmatter.data.title.trim() : ""
    record.aliases = Array.isArray(frontmatter.data.aliases)
      ? frontmatter.data.aliases.filter((alias) => typeof alias === "string")
      : typeof frontmatter.data.aliases === "string"
        ? [frontmatter.data.aliases]
        : []
    record.headings = [...record.scanBody.matchAll(/^(#{1,6})\s+(.+)$/gmu)].map((match) =>
      stripHeadingMarkup(match[2]),
    )

    const h1Headings = [...record.scanBody.matchAll(/^#\s+(?!#)(.+)$/gmu)]
    const h2Headings = [...record.scanBody.matchAll(/^##\s+(?!#)(.+)$/gmu)].map((match) =>
      normalizeName(stripHeadingMarkup(match[1])),
    )
    const duplicateH2Headings = [...new Set(h2Headings.filter((heading, index) =>
      h2Headings.indexOf(heading) !== index,
    ))]
    for (const heading of duplicateH2Headings) {
      errors.push(`Duplicate H2 heading: ${vaultRelative} -> ${heading}`)
    }

    const bodyLines = record.body.split(/\r?\n/u)
    let inFence = false
    for (let index = 0; index < bodyLines.length; index += 1) {
      if (/^\s*```/u.test(bodyLines[index])) {
        inFence = !inFence
        continue
      }
      if (inFence) continue
      const heading = bodyLines[index].match(/^(#{2,6})\s+(.+)$/u)
      if (!heading) continue
      let next = index + 1
      while (
        next < bodyLines.length &&
        (bodyLines[next].trim() === "" || bodyLines[next].trim() === "---")
      ) next += 1
      const nextHeading = next < bodyLines.length ? bodyLines[next].match(/^(#{1,6})\s+/u) : null
      if (next >= bodyLines.length || (nextHeading && nextHeading[1].length <= heading[1].length)) {
        errors.push(`Empty heading section: ${vaultRelative}:${index + 1} -> ${stripHeadingMarkup(heading[2])}`)
      }
    }

    const isDraft = frontmatter.data.draft === true
    const mayUseFrontmatterTitle =
      Boolean(record.title) &&
      ["index", "overview"].includes(record.basename.toLocaleLowerCase("en-US"))

    if (
      h1Headings.length === 0 &&
      !isDraft &&
      !mayUseFrontmatterTitle &&
      record.basename !== "Explore Locations"
    ) {
      warnings.push(`Missing H1: ${vaultRelative}`)
    }
    if (h1Headings.length > 1) errors.push(`Multiple H1 headings: ${vaultRelative}`)

    const prose = frontmatter.body
      .replace(/<!--[\s\S]*?-->/gu, "")
      .replace(/\s/gu, "")
    if (prose.length === 0 && !isDraft) errors.push(`Empty published Markdown file: ${vaultRelative}`)

    const isPlayableLineage =
      vaultRelative.includes("/People & Culture/People/") &&
      !record.basename.startsWith("∅") &&
      record.basename.toLocaleLowerCase("en-US") !== "index"

    if (isPlayableLineage) {
      const requiredLineageHeadings = [
        "## IX. D&D Lineage Traits",
        "### Creature Type",
        "### Ability Score Increase",
        "### Speed",
        "## XI. Homeland Imprints",
      ]

      for (const heading of requiredLineageHeadings) {
        if (!record.scanBody.includes(heading)) {
          errors.push(`Incomplete lineage schema: ${vaultRelative} -> missing ${heading}`)
        }
      }

      if (!/^## X\. Recognized .+$/mu.test(record.scanBody)) {
        errors.push(`Incomplete lineage schema: ${vaultRelative} -> missing recognized lineage tradition`)
      }

      const lineageTraits = record.scanBody.match(
        /^## IX\. D&D Lineage Traits\s*$([\s\S]*?)(?=^## X\.)/mu,
      )?.[1]
      const innateHeadings = lineageTraits
        ? [...lineageTraits.matchAll(/^### (.+)$/gmu)].map((match) => stripHeadingMarkup(match[1]))
        : []
      const coreHeadings = new Set(["Creature Type", "Ability Score Increase", "Size", "Speed"])

      if (!innateHeadings.some((heading) => !coreHeadings.has(heading))) {
        errors.push(`Incomplete lineage schema: ${vaultRelative} -> no innate ability documented`)
      }

      const recognizedTraits = record.scanBody.match(/^## X\. .+\s*$([\s\S]*?)(?=^## XI\.)/mu)?.[1]
      if (
        recognizedTraits &&
        !/Ability Score Increase|No distinct|do not possess conventional|mechanical effects follow/iu.test(
          recognizedTraits,
        )
      ) {
        errors.push(
          `Incomplete lineage schema: ${vaultRelative} -> recognized lineage has no addition or explicit exception`,
        )
      }
    }
  }

  records.push(record)
}

const indexes = {
  records,
  byContentPath: new Map(),
  byVaultPath: new Map(),
  byBasename: new Map(),
  byName: new Map(),
}

for (const record of records) {
  addToMap(indexes.byContentPath, record.contentRelative, record)
  addToMap(indexes.byVaultPath, record.vaultRelative, record)
  addToMap(indexes.byBasename, record.basename, record)
  addToMap(indexes.byName, record.basename.replace(/^(?:(?:\d+|[IVXLCDM]+)\.\s+|∅\s+)/u, ""), record)
  addToMap(indexes.byName, record.title, record)
  for (const alias of record.aliases) addToMap(indexes.byName, alias, record)
}

for (const record of records.filter((item) => item.extension === ".md")) {
  const wikiPattern = /(!?)\[\[([^\]\n]+)\]\]/gu
  for (const match of record.scanBody.matchAll(wikiPattern)) {
    const rawTarget = match[2]
    const line = lineNumberAt(record.scanBody, match.index)
    const resolution = resolveWikiTarget(record, rawTarget, indexes)
    if (resolution.external) continue

    if (resolution.records.length === 0) {
      const targetName = splitWikiTarget(rawTarget).target
      const normalizedTarget = normalizeName(targetName)
      if (!allowlistedLinks.has(normalizedTarget)) {
        errors.push(`Unresolved wikilink: ${record.vaultRelative}:${line} -> [[${rawTarget}]]`)
      } else {
        usedAllowlistedLinks.add(normalizedTarget)
      }
      continue
    }

    if (resolution.records.length > 1) {
      warnings.push(
        `Ambiguous wikilink: ${record.vaultRelative}:${line} -> [[${rawTarget}]] (${resolution.records
          .map((item) => item.vaultRelative)
          .join(", ")})`,
      )
      continue
    }

    if (resolution.heading && !hasHeading(resolution.records[0], resolution.heading)) {
      errors.push(
        `Missing heading target: ${record.vaultRelative}:${line} -> [[${rawTarget}]] in ${resolution.records[0].vaultRelative}`,
      )
    }
  }

  const markdownLinkPattern = /!?\[[^\]\n]*\]\(([^)\n]+)\)/gu
  for (const match of record.scanBody.matchAll(markdownLinkPattern)) {
    const rawTarget = match[1].trim().replace(/^<|>$/gu, "")
    if (!rawTarget || rawTarget.startsWith("#") || /^[a-z][a-z0-9+.-]*:/iu.test(rawTarget)) continue
    const fileTarget = rawTarget.split("#")[0]
    const absoluteTarget = path.resolve(path.dirname(record.absolute), fileTarget)
    try {
      await fs.access(absoluteTarget)
    } catch {
      const line = lineNumberAt(record.scanBody, match.index)
      errors.push(`Unresolved Markdown link: ${record.vaultRelative}:${line} -> (${rawTarget})`)
    }
  }
}

for (const target of allowlistedLinks) {
  if (!usedAllowlistedLinks.has(target)) warnings.push(`Unused unwritten-link allowlist entry: ${target}`)
}

const coverage = new Map()
for (const record of records.filter((item) => item.extension === ".md")) {
  const [division = "(vault root)", category = "(root)"] = record.vaultRelative.split("/")
  const key = `${division} / ${category}`
  coverage.set(key, (coverage.get(key) ?? 0) + 1)
}

console.log(`Wiki files checked: ${markdownFiles.length}`)
console.log(`Vault assets indexed: ${records.length - markdownFiles.length}`)
console.log("Coverage:")
for (const [key, count] of [...coverage].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`  ${String(count).padStart(3)}  ${key}`)
}

if (warnings.length > 0) {
  console.log(`\nWarnings (${warnings.length}):`)
  for (const warning of warnings) console.log(`- ${warning}`)
}

if (errors.length > 0) {
  console.error(`\nErrors (${errors.length}):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log("\nWiki check passed.")
}

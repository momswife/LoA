import fs from "node:fs/promises"
import path from "node:path"
import { globby } from "globby"
import { parse } from "yaml"
import { FilePath, slugifyFilePath } from "../quartz/util/path"
import { ShareRecord, validateShareLinks } from "../quartz/util/shareLinks"

// Only inserts metadata; never serializes YAML or rewrites the article body.
const files = await globby("**/*.md", {
  cwd: "content",
  ignore: ["templates/**", "private/**", "**/.obsidian/**", "**/AGENTS.md"],
})
const entries = await Promise.all(
  files.sort().map(async (file) => {
    const text = await fs.readFile(path.join("content", file), "utf8")
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
    const frontmatter = match ? (parse(match[1]) ?? {}) : {}
    const aliases = Array.isArray(frontmatter.aliases) ? frontmatter.aliases : []
    const record: ShareRecord = {
      slug: slugifyFilePath(file as FilePath),
      aliases: aliases.map((alias: string) => slugifyFilePath(`${alias}.md` as FilePath)),
      frontmatter,
    }
    return { file, text, match, record }
  }),
)
const records = entries.map((entry) => entry.record)
const occupied = new Map<string, Set<string>>()
for (const record of records) {
  for (const route of [record.slug, ...(record.aliases ?? []), record.frontmatter?.permalink]) {
    if (typeof route !== "string") continue
    const owners = occupied.get(route) ?? new Set<string>()
    owners.add(record.slug)
    occupied.set(route, owners)
  }
}
let count = 0
const changes: { file: string; text: string }[] = []
for (const entry of entries) {
  const { file, text, match, record } = entry
  const fm = record.frontmatter!
  if (
    !file.startsWith("Aerathon - Eternal Labyrinths/") ||
    /^(?:index|overview|∅.*)\.md$/i.test(path.basename(file)) ||
    fm.draft ||
    fm.password ||
    fm.unlisted ||
    fm.permalink
  )
    continue
  const title = String(fm.title ?? path.basename(file, ".md"))
  const base =
    title
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .replace(/^(?:[IVXLCDM]+|\d+[a-z]?)\.\s*/i, "")
      .replace(/^the\s+/i, "")
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "article"
  let address = base
  let suffix = 2
  const unavailable = (route: string) =>
    /^(index|404|tags|static|assets|robots|sitemap)$/.test(route) ||
    [...(occupied.get(route) ?? [])].some((owner) => owner !== record.slug) ||
    records.some((other) => other.slug.startsWith(`${route}/`))
  while (unavailable(address)) address = `${base}-${suffix++}`
  fm.permalink = address
  occupied.set(address, new Set([record.slug]))
  const newline = text.includes("\r\n") ? "\r\n" : "\n"
  const insertion = `permalink: ${address}${newline}`
  const updated = match
    ? text.slice(0, 3 + newline.length) + insertion + text.slice(3 + newline.length)
    : `---${newline}${insertion}---${newline}${newline}${text}`
  changes.push({ file, text: updated })
  count++
}
validateShareLinks(records)
for (const change of changes) await fs.writeFile(path.join("content", change.file), change.text)
console.log(`Assigned stable short addresses to ${count} articles.`)

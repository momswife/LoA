import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const repoRoot = process.cwd()
const roots = [
  path.join(repoRoot, "content", "Aerathon - Eternal Labyrinths"),
  path.join(repoRoot, "content", "templates"),
]
const checkOnly = process.argv.includes("--check")

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.name === ".obsidian") continue
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(absolute)))
    else if (entry.name.endsWith(".md")) files.push(absolute)
  }
  return files
}

function normalizeMarkdown(text) {
  const hadFinalNewline = text.endsWith("\n")
  const normalized = text
    .replace(/\r\n/gu, "\n")
    .split("\n")
    .map((line) => {
      const heading = line.match(/^(#{1,6})\s+(.+)$/u)
      if (heading) {
        const content = heading[2]
          .replace(/\*\*/gu, "")
          .replace(/__/gu, "")
          .trim()
        if (/^━+.*━+$/u.test(content)) return content
        return `${heading[1]} ${content}`
      }
      if (/^(?:___|~~)$/u.test(line.trim())) return "---"
      return line
    })
    .join("\n")

  return hadFinalNewline || normalized.length === 0 ? normalized : `${normalized}\n`
}

const files = (await Promise.all(roots.map(walk))).flat()
const changed = []

for (const file of files) {
  const before = await fs.readFile(file, "utf8")
  const after = normalizeMarkdown(before)
  if (before === after) continue
  changed.push(path.relative(repoRoot, file).split(path.sep).join("/"))
  if (!checkOnly) await fs.writeFile(file, after, "utf8")
}

if (changed.length === 0) {
  console.log("Wiki Markdown formatting is normalized.")
} else if (checkOnly) {
  console.error(`Wiki Markdown formatting required in ${changed.length} files:`)
  for (const file of changed) console.error(`- ${file}`)
  process.exitCode = 1
} else {
  console.log(`Normalized Wiki Markdown formatting in ${changed.length} files.`)
}

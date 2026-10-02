import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const repoRoot = fileURLToPath(new URL("../", import.meta.url))
const wikiCheck = path.join(repoRoot, "scripts", "wiki-check.mjs")
const wikiFormat = path.join(repoRoot, "scripts", "wiki-format.mjs")

async function createFixture() {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "loa-wiki-e2e-"))
  await fs.mkdir(path.join(fixtureRoot, "content", "Aerathon - Eternal Labyrinths"), {
    recursive: true,
  })
  await fs.mkdir(path.join(fixtureRoot, "content", "templates"), { recursive: true })
  return fixtureRoot
}

async function removeFixture(fixtureRoot) {
  const resolvedFixture = path.resolve(fixtureRoot)
  const resolvedTemp = `${path.resolve(os.tmpdir())}${path.sep}`
  assert.ok(
    resolvedFixture.startsWith(resolvedTemp),
    "fixture cleanup must stay in the temp directory",
  )
  await fs.rm(resolvedFixture, { recursive: true, force: true })
}

async function writeFixtureFile(fixtureRoot, relativePath, contents) {
  const absolute = path.join(fixtureRoot, relativePath)
  await fs.mkdir(path.dirname(absolute), { recursive: true })
  await fs.writeFile(absolute, contents, "utf8")
  return absolute
}

function runScript(script, fixtureRoot, args = []) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: fixtureRoot,
    encoding: "utf8",
    windowsHide: true,
  })
}

test("wiki check accepts a linked vault and ignores repository instructions", async (t) => {
  const fixtureRoot = await createFixture()
  t.after(() => removeFixture(fixtureRoot))

  await writeFixtureFile(
    fixtureRoot,
    "content/Aerathon - Eternal Labyrinths/01. First Record.md",
    [
      "# First Record",
      "",
      "See [[02. Second Record#Details|the second record]].",
      "",
      "![Filed map](map.png)",
      "",
    ].join("\n"),
  )
  await writeFixtureFile(
    fixtureRoot,
    "content/Aerathon - Eternal Labyrinths/02. Second Record.md",
    [
      "---",
      "aliases:",
      "  - Supporting Record",
      "---",
      "# Second Record",
      "",
      "## Details",
      "",
      "Filed evidence.",
      "",
    ].join("\n"),
  )
  await writeFixtureFile(
    fixtureRoot,
    "content/Aerathon - Eternal Labyrinths/AGENTS.md",
    "[[This Must Not Be Validated]]\n",
  )
  await writeFixtureFile(
    fixtureRoot,
    "content/Aerathon - Eternal Labyrinths/map.png",
    "fixture asset",
  )

  const result = runScript(wikiCheck, fixtureRoot)

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Wiki files checked: 2/u)
  assert.match(result.stdout, /Vault assets indexed: 1/u)
  assert.match(result.stdout, /Wiki check passed\./u)
})

test("wiki check reports frontmatter and link failures through its CLI", async (t) => {
  const fixtureRoot = await createFixture()
  t.after(() => removeFixture(fixtureRoot))

  await writeFixtureFile(
    fixtureRoot,
    "content/Aerathon - Eternal Labyrinths/Broken Record.md",
    [
      "---",
      "draft: sometimes",
      "---",
      "# Broken Record",
      "",
      "See [[Missing Record]] and [[Known Record#Absent Section]].",
      "",
      "[Missing attachment](missing.pdf)",
      "",
    ].join("\n"),
  )
  await writeFixtureFile(
    fixtureRoot,
    "content/Aerathon - Eternal Labyrinths/Known Record.md",
    "# Known Record\n\nAvailable evidence.\n",
  )

  const result = runScript(wikiCheck, fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /draft must be a boolean/u)
  assert.match(result.stderr, /Unresolved wikilink: .*\[\[Missing Record\]\]/u)
  assert.match(result.stderr, /Missing heading target: .*Absent Section/u)
  assert.match(result.stderr, /Unresolved Markdown link: .*missing\.pdf/u)
})

test("wiki check honors intentional unwritten-link allowlisting", async (t) => {
  const fixtureRoot = await createFixture()
  t.after(() => removeFixture(fixtureRoot))

  await writeFixtureFile(
    fixtureRoot,
    "content/Aerathon - Eternal Labyrinths/Planned Record.md",
    "# Planned Record\n\nSee [[Future Filing]].\n",
  )
  await writeFixtureFile(
    fixtureRoot,
    "wiki-link-allowlist.json",
    `${JSON.stringify({ unwrittenWikiLinks: ["Future Filing"] }, null, 2)}\n`,
  )

  const result = runScript(wikiCheck, fixtureRoot)

  assert.equal(result.status, 0, result.stderr)
  assert.doesNotMatch(result.stdout, /Unused unwritten-link allowlist entry/u)
  assert.match(result.stdout, /Wiki check passed\./u)
})

test("wiki formatter fails check mode, repairs files, and then passes", async (t) => {
  const fixtureRoot = await createFixture()
  t.after(() => removeFixture(fixtureRoot))

  const recordPath = await writeFixtureFile(
    fixtureRoot,
    "content/Aerathon - Eternal Labyrinths/Formatting Record.md",
    "# **Formatting Record**\r\n\r\n___",
  )

  const before = runScript(wikiFormat, fixtureRoot, ["--check"])
  assert.equal(before.status, 1)
  assert.match(before.stderr, /Wiki Markdown formatting required in 1 files/u)

  const repair = runScript(wikiFormat, fixtureRoot)
  assert.equal(repair.status, 0, repair.stderr)
  assert.match(repair.stdout, /Normalized Wiki Markdown formatting in 1 files/u)
  assert.equal(await fs.readFile(recordPath, "utf8"), "# Formatting Record\n\n---\n")

  const after = runScript(wikiFormat, fixtureRoot, ["--check"])
  assert.equal(after.status, 0, after.stderr)
  assert.match(after.stdout, /Wiki Markdown formatting is normalized\./u)
})

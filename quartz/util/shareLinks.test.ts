import test from "node:test"
import assert from "node:assert/strict"
import { shareAddress, validateShareLinks } from "./shareLinks"

test("share addresses retain the GitHub Pages project path", () => {
  assert.equal(
    shareAddress("momswife.github.io/LoA/", "hearthward-compact"),
    "https://momswife.github.io/LoA/hearthward-compact",
  )
  assert.equal(
    shareAddress("example.org", "hearthward-compact"),
    "https://example.org/hearthward-compact",
  )
})

test("the same article can own both an alias and a permalink", () => {
  validateShareLinks([
    { slug: "deep/article", aliases: ["article"], frontmatter: { permalink: "article" } },
  ])
})

test("duplicate permalinks and collisions with aliases, pages or folders fail", () => {
  const article = { slug: "deep/article", frontmatter: { permalink: "article" } }
  for (const other of [
    { slug: "elsewhere", frontmatter: { permalink: "article" } },
    { slug: "elsewhere", aliases: ["article"] },
    { slug: "article" },
    { slug: "article/index" },
    { slug: "article/child" },
  ])
    assert.throws(() => validateShareLinks([article, other]), /conflicts/)
})

test("unsafe or reserved short addresses fail", () => {
  for (const permalink of [
    "../escape",
    "https://elsewhere.test",
    "/article",
    "Article",
    "",
    "tags",
    "index",
    12,
  ]) {
    assert.throws(
      () => validateShareLinks([{ slug: "deep/article", frontmatter: { permalink } }]),
      /Invalid/,
    )
  }
})

test("moving and renaming an article leaves its saved share address usable", () => {
  validateShareLinks([
    { slug: "new-folder/new-title", frontmatter: { permalink: "original-name" } },
  ])
  assert.equal(
    shareAddress("example.org/wiki", "original-name"),
    "https://example.org/wiki/original-name",
  )
})

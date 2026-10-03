import { test } from "node:test"
import assert from "node:assert/strict"
import { publicDirectoryTrie } from "./publicDirectory"
import type { QuartzPluginData } from "../plugins/vfile"

test("public directory excludes hidden records and virtual pages without source paths", () => {
  const files = [
    { slug: "atlas/public", filePath: "content/atlas/public.md", frontmatter: { title: "Public" } },
    {
      slug: "atlas/hidden/index",
      filePath: "content/atlas/hidden/index.md",
      frontmatter: { title: "Hidden" },
      unlisted: true,
    },
    { slug: "atlas/virtual", frontmatter: { title: "Virtual" } },
    { filePath: "content/atlas/missing.md", frontmatter: { title: "No slug" } },
  ] as QuartzPluginData[]
  const trie = publicDirectoryTrie(files)
  assert.ok(trie.findNode(["atlas", "public"]))
  assert.equal(trie.findNode(["atlas", "hidden"]), undefined)
  assert.equal(trie.findNode(["atlas", "virtual"]), undefined)
})

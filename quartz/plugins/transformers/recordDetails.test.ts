import assert from "node:assert/strict"
import { describe, test } from "node:test"
import type { Element, Root } from "hast"
import { unified } from "unified"
import { VFile } from "vfile"
import type { BuildCtx } from "../../util/ctx"
import { RecordDetails } from "./recordDetails"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"

async function renderFooter(source: string): Promise<Root> {
  const parser = unified().use(remarkParse).use(remarkRehype)
  const file = new VFile({ value: source })
  const tree = await parser.run(parser.parse(file), file)
  await unified()
    .use(RecordDetails().htmlPlugins?.({} as BuildCtx) ?? [])
    .run(tree, file)
  return tree as Root
}

function flatten(node: any): string {
  return node.type === "text" ? node.value : (node.children ?? []).map(flatten).join("")
}

function filingPanel(tree: Root): Element | undefined {
  return tree.children.find(
    (node): node is Element =>
      node.type === "element" &&
      (node.properties.className as string[] | undefined)?.includes("record-file-footer") === true,
  )
}

describe("MDO filing footer", () => {
  test("renders quoted and plain legacy records with the same structure", async () => {
    const lines = [
      "**Filed & Authenticated**",
      "**Ministry of Delving Operations — Annals**",
      "**Document Class:** _Historical Record_",
      "**Primary Compilation:** Archivist A",
      "— Preserve this legal notice.",
      "**MDO ARCHIVE · RECORD SEALED**",
    ]
    const plain = await renderFooter(lines.join("  \n"))
    const quoted = await renderFooter(lines.map((line) => `> ${line}`).join("\n>\n"))
    const structure = (tree: Root) =>
      JSON.parse(
        JSON.stringify(filingPanel(tree), (key, value) => (key === "position" ? undefined : value)),
      )
    assert.deepEqual(structure(plain), structure(quoted))
    assert.match(flatten(filingPanel(plain)), /Primary CompilationArchivist A/)
    assert.match(flatten(filingPanel(plain)), /Preserve this legal notice/)
  })

  test("preserves a denied status without adding a sealed claim", async () => {
    const tree = await renderFooter(
      "**Filed & Authenticated**  \n**Ministry of Delving Operations**\n\n**Document Class:** Restricted\n\n— This record does not exist.\n\n**MDO ARCHIVE · RECORD DENIED**",
    )
    const text = flatten(filingPanel(tree))
    assert.match(text, /This record does not exist/)
    assert.match(text, /RECORD DENIED/)
    assert.doesNotMatch(text, /RECORD SEALED/)
    assert.equal(tree.children.filter((node) => flatten(node).includes("RECORD DENIED")).length, 1)
  })

  test("stops before a later section and preserves lists and links", async () => {
    const tree = await renderFooter(
      "**Filed & Authenticated**\n\n**Document Class:** [Record](https://example.org)\n\n## Related records\n\n- An unrelated item\n\n**MDO ARCHIVE · RECORD SEALED**",
    )
    const panel = filingPanel(tree)!
    assert.doesNotMatch(flatten(panel), /Related records|unrelated|SEALED/)
    assert.ok(JSON.stringify(panel).includes("https://example.org"))
    assert.ok(tree.children.some((node) => node.type === "element" && node.tagName === "ul"))
  })

  test("normalizes a legacy closing ornament once and retains following content", async () => {
    const tree = await renderFooter(
      "> **Filed & Authenticated**\n>\n> **Document Class:** Record\n>\n> ——— ⭕ **END OF FILE** ⭕ ———\n\n## Workshop Records\n\n[Workshop](https://example.org)",
    )
    assert.equal((flatten(tree).match(/MDO ARCHIVE · RECORD SEALED/g) ?? []).length, 1)
    assert.match(flatten(tree), /Workshop Records\s*Workshop/)
  })

  test("does not interpret prose, examples, or missing authentication as a footer", async () => {
    const tree = await renderFooter(
      "A form may say Filed & Authenticated, but that is not evidence.\n\n```text\nFiled & Authenticated\n```\n\n## Reference\n\nA plain guide.",
    )
    assert.equal(filingPanel(tree), undefined)
  })
})

function paragraph(label: string, value: string): Element {
  return {
    type: "element",
    tagName: "p",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "strong",
        properties: {},
        children: [{ type: "text", value: `${label}:` }],
      },
      { type: "text", value: ` ${value}` },
    ],
  }
}

describe("RecordDetails", () => {
  test("suppresses the compact masthead card when an authored details block exists", async () => {
    const tree: Root = {
      type: "root",
      children: [
        paragraph("Filed Division", "Living Atlas"),
        paragraph("Document Class", "Organization Record"),
        {
          type: "element",
          tagName: "h2",
          properties: {},
          children: [{ type: "text", value: "Overview" }],
        },
      ],
    }
    const file = new VFile()
    file.data = { frontmatter: { title: "Fixture", facts: { Standing: "Active" } } }
    const plugins = RecordDetails().htmlPlugins?.({} as BuildCtx) ?? []

    await unified().use(plugins).run(tree, file)

    assert.equal(file.data.frontmatter?.showMastheadRecord, false)
  })

  test("preserves an explicit request to show the compact masthead card", async () => {
    const tree: Root = {
      type: "root",
      children: [paragraph("Filed Division", "Living Atlas")],
    }
    const file = new VFile()
    file.data = { frontmatter: { title: "Fixture", showMastheadRecord: true } }
    const plugins = RecordDetails().htmlPlugins?.({} as BuildCtx) ?? []

    await unified().use(plugins).run(tree, file)

    assert.equal(file.data.frontmatter?.showMastheadRecord, true)
  })
})

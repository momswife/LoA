import assert from "node:assert/strict"
import { describe, test } from "node:test"
import type { Element, Root } from "hast"
import { unified } from "unified"
import { VFile } from "vfile"
import type { BuildCtx } from "../../util/ctx"
import { RecordDetails } from "./recordDetails"

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

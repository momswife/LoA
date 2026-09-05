import assert from "node:assert/strict"
import { describe, test } from "node:test"
import type { Element, Root } from "hast"
import { unified } from "unified"
import { VFile } from "vfile"
import type { BuildCtx } from "../../util/ctx"
import { DEFAULT_SPOILER_WARNING } from "../../util/spoilers"
import {
  protectSpoilerMetadata,
  SPOILER_READING_TEXT_KEY,
  SpoilerProtection,
} from "./spoilerProtection"

describe("protectSpoilerMetadata", () => {
  test("removes spoiler prose from indexes and preserves reading-time text", () => {
    const data: Record<string, unknown> = {
      frontmatter: { spoiler: true },
      text: "The secret heir survived.",
      description: "The secret heir survived.",
    }

    assert.equal(protectSpoilerMetadata(data), true)
    assert.equal(data.text, "")
    assert.equal(data.description, DEFAULT_SPOILER_WARNING)
    assert.equal(data[SPOILER_READING_TEXT_KEY], "The secret heir survived.")
  })

  test("uses an authored spoiler-safe warning", () => {
    const data: Record<string, unknown> = {
      frontmatter: {
        spoiler: true,
        spoilerWarning: "Reveals the outcome of the current expedition.",
      },
      text: "Secret result",
    }

    protectSpoilerMetadata(data)
    assert.equal(data.description, "Reveals the outcome of the current expedition.")
  })

  test("leaves ordinary pages unchanged", () => {
    const data: Record<string, unknown> = {
      frontmatter: { spoiler: false },
      text: "Public record",
      description: "Public description",
    }

    assert.equal(protectSpoilerMetadata(data), false)
    assert.equal(data.text, "Public record")
    assert.equal(data.description, "Public description")
    assert.equal(data[SPOILER_READING_TEXT_KEY], undefined)
  })

  test("preserves the rendered content tree", async () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [{ type: "text", value: "Hidden but still rendered" }],
        },
      ],
    }
    const file = new VFile()
    file.data = {
      frontmatter: { title: "Spoiler fixture", spoiler: true },
      text: "Hidden but still rendered",
    }
    const plugins = SpoilerProtection().htmlPlugins?.({} as BuildCtx) ?? []

    const transformed = (await unified().use(plugins).run(tree, file)) as Root
    const paragraph = transformed.children[0] as Element

    assert.equal(paragraph.tagName, "p")
    assert.equal(JSON.stringify(paragraph.children).includes("Hidden but still rendered"), true)
    assert.equal(file.data.text, "")
  })
})

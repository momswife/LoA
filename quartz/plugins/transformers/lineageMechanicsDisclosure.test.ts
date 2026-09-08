import assert from "node:assert/strict"
import { describe, test } from "node:test"
import type { Element, Root } from "hast"
import { wrapLineageMechanics } from "./lineageMechanicsDisclosure"

function heading(id: string, text: string): Element {
  return {
    type: "element",
    tagName: "h2",
    properties: { id },
    children: [{ type: "text", value: text }],
  }
}

describe("wrapLineageMechanics", () => {
  test("wraps lineage mechanics and leaves the registry advisory visible", () => {
    const tree: Root = {
      type: "root",
      children: [
        heading("viii-names", "VIII. Names"),
        heading("ix-dd-lineage-traits", "IX. D&D Lineage Traits"),
        { type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: "Creature Type: Humanoid" }] },
        heading("x-recognized-sublineages", "X. Recognized Sublineages"),
        heading("xi-homeland-imprints", "XI. Homeland Imprints"),
        heading("xii-playing-a-lineage", "XII. Playing a Lineage"),
        heading("xiii-registry-advisory", "XIII. Registry Advisory"),
        { type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: "Visible advisory" }] },
      ],
    }

    assert.equal(wrapLineageMechanics(tree), true)
    const wrapped = tree.children[2] as Element
    assert.equal(wrapped.properties?.["data-callout"], "ooc")
    assert.deepEqual(wrapped.properties?.className, [
      "callout",
      "ooc",
      "is-collapsible",
      "is-collapsed",
    ])
    assert.equal((tree.children[3] as Element).properties?.id, "xiii-registry-advisory")
    assert.equal(JSON.stringify(wrapped).includes("Visible advisory"), false)
    assert.equal(JSON.stringify(wrapped).includes("Creature Type: Humanoid"), true)
  })

  test("uses an authored registry callout as the boundary when section XIII is absent", () => {
    const registry: Element = {
      type: "element",
      tagName: "blockquote",
      properties: { "data-callout": "note" },
      children: [{ type: "text", value: "MDO Registry Advisory" }],
    }
    const tree: Root = {
      type: "root",
      children: [
        heading("ix-dd-lineage-traits", "IX. D&D Lineage Traits"),
        { type: "text", value: "Mechanics" },
        registry,
      ],
    }

    assert.equal(wrapLineageMechanics(tree), true)
    assert.equal(tree.children[2], registry)
  })

  test("ignores ordinary records and repeated transforms", () => {
    const ordinary: Root = { type: "root", children: [heading("i-overview", "I. Overview")] }
    assert.equal(wrapLineageMechanics(ordinary), false)

    const lineage: Root = {
      type: "root",
      children: [heading("ix-dd-lineage-traits", "IX. D&D Lineage Traits"), { type: "text", value: "Rules" }],
    }
    assert.equal(wrapLineageMechanics(lineage), true)
    assert.equal(wrapLineageMechanics(lineage), false)
  })
})

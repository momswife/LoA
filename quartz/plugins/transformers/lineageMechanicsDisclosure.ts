import type { Element, ElementContent, Root, RootContent } from "hast"
import { QuartzTransformerPlugin } from "../types"

const disclosureTitle = "MDO Archival Code — OOC — Review at Your Own Discretion"

function elementText(node: RootContent): string {
  if (node.type === "text") return node.value
  if ("children" in node) return node.children.map((child) => elementText(child)).join("")
  return ""
}

function isHeading(node: RootContent, id: string): node is Element {
  return (
    node.type === "element" && node.tagName === "h2" && String(node.properties?.id ?? "") === id
  )
}

function isRegistryAdvisory(node: RootContent): boolean {
  return (
    node.type === "element" &&
    node.tagName === "blockquote" &&
    elementText(node).includes("MDO Registry Advisory")
  )
}

function disclosure(content: ElementContent[]): Element {
  return {
    type: "element",
    tagName: "blockquote",
    properties: {
      className: ["callout", "ooc", "is-collapsible", "is-collapsed"],
      "data-callout": "ooc",
      "data-callout-fold": "",
      "data-callout-metadata": "",
    },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["callout-title"] },
        children: [
          {
            type: "element",
            tagName: "div",
            properties: { className: ["callout-icon"] },
            children: [],
          },
          {
            type: "element",
            tagName: "div",
            properties: { className: ["callout-title-inner"] },
            children: [
              {
                type: "element",
                tagName: "p",
                properties: {},
                children: [{ type: "text", value: disclosureTitle }],
              },
            ],
          },
          {
            type: "element",
            tagName: "div",
            properties: { className: ["fold-callout-icon", "callout-fold"] },
            children: [],
          },
        ],
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["callout-content"] },
        children: content,
      },
    ],
  }
}

/**
 * Place the table-facing portion of a playable-lineage record behind the same
 * OOC disclosure used by bestiary mechanics. The authored heading remains in
 * place so the archive's numbered document structure and heading links remain
 * stable.
 */
export function wrapLineageMechanics(tree: Root): boolean {
  const start = tree.children.findIndex((node) => isHeading(node, "ix-dd-lineage-traits"))
  if (start < 0) return false

  const alreadyWrapped = tree.children[start + 1]
  if (
    alreadyWrapped?.type === "element" &&
    alreadyWrapped.tagName === "blockquote" &&
    alreadyWrapped.properties?.["data-callout"] === "ooc"
  ) {
    return false
  }

  let end = tree.children.findIndex(
    (node, index) => index > start && isHeading(node, "xiii-registry-advisory"),
  )
  if (end < 0) {
    end = tree.children.findIndex((node, index) => index > start && isRegistryAdvisory(node))
  }
  if (end < 0) end = tree.children.length

  const contentRange = tree.children.slice(start + 1, end)
  const content = contentRange.filter((node): node is ElementContent => node.type !== "doctype")
  if (content.length === 0) return false

  tree.children.splice(start + 1, contentRange.length, disclosure(content))
  return true
}

export const LineageMechanicsDisclosure: QuartzTransformerPlugin = () => ({
  name: "LineageMechanicsDisclosure",
  htmlPlugins() {
    return [
      () => (tree: Root) => {
        wrapLineageMechanics(tree)
      },
    ]
  },
})

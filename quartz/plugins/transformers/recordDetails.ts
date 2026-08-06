import { Element, ElementContent, Root, RootContent } from "hast"
import { QuartzTransformerPlugin } from "../types"

function textContent(node: ElementContent): string {
  if (node.type === "text") return node.value
  if (node.type === "element") return node.children.map(textContent).join("")
  return ""
}

function addClass(node: Element, className: string) {
  node.properties ??= {}
  const current = node.properties.className
  const classes = Array.isArray(current)
    ? current.map(String)
    : typeof current === "string"
      ? current.split(/\s+/)
      : []
  if (!classes.includes(className)) classes.push(className)
  node.properties.className = classes
}

function countStrongElements(node: Element): number {
  return node.children.reduce((count, child) => {
    if (child.type !== "element") return count
    return count + (child.tagName === "strong" ? 1 : 0) + countStrongElements(child)
  }, 0)
}

function transformChildren(children: RootContent[]) {
  for (let index = 0; index < children.length; index++) {
    const node = children[index]
    if (node.type !== "element") continue

    transformChildren(node.children)

    if (node.tagName !== "p") continue
    const paragraphText = textContent(node).trim()
    if (!paragraphText.startsWith("Filed Division:") || countStrongElements(node) < 3) continue

    let subtitleIndex = index - 1
    while (subtitleIndex >= 0) {
      const sibling = children[subtitleIndex]
      if (sibling.type !== "text" || sibling.value.trim() !== "") break
      subtitleIndex--
    }
    const subtitle = children[subtitleIndex]
    if (subtitle?.type !== "element" || subtitle.tagName !== "h3") continue

    addClass(subtitle, "record-subtitle")
    const details: Element = {
      type: "element",
      tagName: "details",
      properties: { className: ["legacy-record-details"] },
      children: [
        {
          type: "element",
          tagName: "summary",
          properties: {},
          children: [{ type: "text", value: "Record details" }],
        },
        {
          type: "element",
          tagName: "div",
          properties: { className: ["legacy-record-details__content"] },
          children: node.children,
        },
      ],
    }

    // Keep the opening quote and title together, then expose filing metadata
    // before the subtitle starts the document proper. The in-body H1 is hidden
    // by the masthead layout, so this appears directly beneath the quote.
    children.splice(index, 1)
    children.splice(subtitleIndex, 0, details)
  }
}

export const RecordDetails: QuartzTransformerPlugin = () => ({
  name: "RecordDetails",
  htmlPlugins() {
    return [() => (tree: Root) => transformChildren(tree.children)]
  },
})

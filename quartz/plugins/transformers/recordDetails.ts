import { Element, ElementContent, Root, RootContent, Text } from "hast"
import { QuartzTransformerPlugin } from "../types"

function textContent(node: ElementContent | RootContent): string {
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

function isElement(node: RootContent | undefined, tagName?: string): node is Element {
  return node?.type === "element" && (!tagName || node.tagName === tagName)
}

function isWhitespace(node: RootContent): boolean {
  return node.type === "text" && node.value.trim() === ""
}

function findMeaningful(
  children: RootContent[],
  start: number,
  direction: 1 | -1,
): number | undefined {
  for (let index = start; index >= 0 && index < children.length; index += direction) {
    if (!isWhitespace(children[index])) return index
  }
  return undefined
}

function splitRows(children: ElementContent[]): ElementContent[][] {
  const rows: ElementContent[][] = [[]]

  for (const child of children) {
    if (isElement(child, "br")) {
      if (rows.at(-1)?.length) rows.push([])
      continue
    }
    rows.at(-1)?.push(child)
  }

  return rows.filter((row) => row.some((child) => textContent(child).trim().length > 0))
}

function removeEndOfFileMarker(children: ElementContent[]): ElementContent[] {
  const result: ElementContent[] = []

  for (const child of children) {
    if (!isElement(child, "p")) {
      result.push(child)
      continue
    }

    const rows = splitRows(child.children)
    const filingStart = rows.findIndex((row) =>
      /Filed\s*(?:&|and)\s*Authenticated/i.test(row.map(textContent).join("")),
    )
    const footerRows = (filingStart >= 0 ? rows.slice(filingStart) : rows).filter(
      (row) =>
        !/(?:END\s+OF\s+FILE|MDO\s+ARCHIVE\s*[·•]\s*RECORD\s+SEALED)/i.test(
          row.map(textContent).join(""),
        ),
    )
    const paragraphChildren: ElementContent[] = []
    for (const [index, row] of footerRows.entries()) {
      if (index > 0) {
        paragraphChildren.push({
          type: "element",
          tagName: "br",
          properties: {},
          children: [],
        })
      }
      paragraphChildren.push(...row)
    }

    result.push({ ...child, children: paragraphChildren })
  }

  return result
}

function trimLeadingPunctuation(children: ElementContent[]): ElementContent[] {
  const result = [...children]
  const first = result[0]
  if (first?.type === "text") {
    const value = first.value.replace(/^\s*:?\s*/, "")
    if (value) result[0] = { ...first, value } satisfies Text
    else result.shift()
  }
  return result
}

function createRecordDetails(paragraph: Element): Element {
  const rows = splitRows(paragraph.children).flatMap((row) => {
    const labelIndex = row.findIndex((child) => isElement(child, "strong"))
    const labelNode = row[labelIndex]
    if (labelIndex < 0 || !isElement(labelNode, "strong")) return []

    const label = textContent(labelNode).trim().replace(/:\s*$/, "")
    const value = trimLeadingPunctuation(row.slice(labelIndex + 1))
    if (!label || value.length === 0) return []

    return [
      {
        type: "element",
        tagName: "div",
        properties: {},
        children: [
          {
            type: "element",
            tagName: "dt",
            properties: {},
            children: [{ type: "text", value: label }],
          },
          {
            type: "element",
            tagName: "dd",
            properties: {},
            children: value,
          },
        ],
      } satisfies Element,
    ]
  })

  return {
    type: "element",
    tagName: "section",
    properties: {
      className: ["record-details"],
      ariaLabelledBy: "record-details-title",
    },
    children: [
      {
        type: "element",
        tagName: "h2",
        properties: { className: ["record-section-label"], id: "record-details-title" },
        children: [{ type: "text", value: "Record details" }],
      },
      ...(rows.length > 0
        ? [
            {
              type: "element",
              tagName: "dl",
              properties: { className: ["record-details__list"] },
              children: rows,
            } satisfies Element,
          ]
        : [
            {
              type: "element",
              tagName: "div",
              properties: { className: ["record-details__fallback"] },
              children: paragraph.children,
            } satisfies Element,
          ]),
    ],
  }
}

function createContentLabel(): Element {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["record-content-label"], ariaHidden: "true" },
    children: [{ type: "text", value: "Record content" }],
  }
}

function paragraphLabel(node: RootContent): string | undefined {
  if (!isElement(node, "p")) return undefined
  const first = node.children.find((child) => textContent(child).trim().length > 0)
  if (!isElement(first, "strong")) return undefined
  return textContent(first).trim().replace(/:\s*$/, "")
}

function findDetailsRange(
  children: RootContent[],
): { start: number; end: number; paragraph: Element } | undefined {
  const startingLabels = new Set(["Filed Division", "Division", "Issuing Authority"])
  let meaningfulNodes = 0
  let start = -1

  for (let index = 0; index < children.length && meaningfulNodes < 16; index++) {
    if (isWhitespace(children[index])) continue
    meaningfulNodes++
    const label = paragraphLabel(children[index])
    if (label && startingLabels.has(label)) {
      start = index
      break
    }
  }

  if (start < 0) return undefined

  let end = start
  const detailChildren: ElementContent[] = []
  for (let index = start; index < children.length; index++) {
    const node = children[index]
    if (isWhitespace(node)) {
      end = index
      continue
    }
    if (!isElement(node, "p") || !paragraphLabel(node)) break
    if (detailChildren.length > 0) {
      detailChildren.push({ type: "element", tagName: "br", properties: {}, children: [] })
    }
    detailChildren.push(...node.children)
    end = index
  }

  return {
    start,
    end,
    paragraph: {
      type: "element",
      tagName: "p",
      properties: {},
      children: detailChildren,
    },
  }
}

function transformFooter(children: RootContent[]) {
  const footerStart = [...children].findLastIndex(
    (node) =>
      isElement(node) &&
      (node.tagName === "blockquote" || node.tagName === "p") &&
      /Filed\s*(?:&|and)\s*Authenticated/i.test(textContent(node)),
  )
  if (footerStart < 0 || !isElement(children[footerStart])) return

  const endOffset = children
    .slice(footerStart)
    .findIndex((node) =>
      /(?:END\s+OF\s+FILE|MDO\s+ARCHIVE\s*[·•]\s*RECORD\s+SEALED)/i.test(textContent(node)),
    )
  const footerEnd = endOffset >= 0 ? footerStart + endOffset : footerStart
  const footerContent = children.slice(footerStart, footerEnd + 1).flatMap((node) => {
    if (!isElement(node)) return []
    if (node.tagName === "blockquote") return node.children
    if (node.tagName === "p") return [node]
    return []
  })
  const sanitizedFooter = removeEndOfFileMarker(footerContent).filter(
    (node) => textContent(node).trim().length > 0,
  )

  children.splice(footerStart, footerEnd - footerStart + 1, {
    type: "element",
    tagName: "section",
    properties: { className: ["record-file-footer"], ariaLabel: "Record footer" },
    children: sanitizedFooter,
  })

  const ornamentIndex = findMeaningful(children, footerStart - 1, -1)
  if (ornamentIndex !== undefined && isElement(children[ornamentIndex])) {
    if (isElement(children[ornamentIndex], "hr")) {
      addClass(children[ornamentIndex] as Element, "record-footer-divider")
      return
    }
    const ornament = textContent(children[ornamentIndex]).trim()
    if (/^[^\p{L}\p{N}]{6,}$/u.test(ornament)) {
      addClass(children[ornamentIndex] as Element, "record-footer-ornament")
    }
  }

  const dividerIndex = findMeaningful(children, (ornamentIndex ?? footerStart) - 1, -1)
  if (dividerIndex !== undefined && isElement(children[dividerIndex], "hr")) {
    addClass(children[dividerIndex] as Element, "record-footer-divider")
  }
}

function transformRecord(children: RootContent[]): boolean {
  const detailsRange = findDetailsRange(children)
  if (!detailsRange) {
    transformFooter(children)
    return false
  }
  const detailsIndex = detailsRange.start

  const openingQuoteIndex = children.findIndex(
    (node, index) => index < detailsIndex && isElement(node, "blockquote"),
  )
  if (openingQuoteIndex >= 0 && isElement(children[openingQuoteIndex], "blockquote")) {
    addClass(children[openingQuoteIndex], "record-opening-quote")
  } else {
    const taglineIndex = [...children]
      .slice(0, detailsIndex)
      .findLastIndex((node) => isElement(node, "h3"))
    if (taglineIndex >= 0 && isElement(children[taglineIndex], "h3")) {
      addClass(children[taglineIndex], "record-opening-quote")
    }
  }

  const duplicateTitleIndex = [...children]
    .slice(0, detailsIndex)
    .findLastIndex((node) => isElement(node, "h1"))
  if (duplicateTitleIndex >= 0 && isElement(children[duplicateTitleIndex], "h1")) {
    addClass(children[duplicateTitleIndex], "record-duplicate-title")
  }

  for (let index = 0; index < detailsIndex; index++) {
    const node = children[index]
    if (isElement(node, "hr")) addClass(node, "record-header-divider")
  }

  children.splice(
    detailsRange.start,
    detailsRange.end - detailsRange.start + 1,
    createRecordDetails(detailsRange.paragraph),
  )

  let contentIndex = findMeaningful(children, detailsIndex + 1, 1)
  while (contentIndex !== undefined && isElement(children[contentIndex], "hr")) {
    addClass(children[contentIndex] as Element, "record-header-divider")
    contentIndex = findMeaningful(children, contentIndex + 1, 1)
  }

  if (contentIndex !== undefined) {
    const firstContent = children[contentIndex]
    if (isElement(firstContent, "h3")) addClass(firstContent, "record-subtitle")
    children.splice(contentIndex, 0, createContentLabel())
  }

  transformFooter(children)
  return true
}

export const RecordDetails: QuartzTransformerPlugin = () => ({
  name: "RecordDetails",
  htmlPlugins() {
    return [
      () => (tree: Root, file) => {
        const hasAuthoredDetails = transformRecord(tree.children)
        const frontmatter = file.data.frontmatter
        if (hasAuthoredDetails && frontmatter && typeof frontmatter === "object") {
          const values = frontmatter as Record<string, unknown>
          values.showMastheadRecord ??= false
        }
      },
    ]
  },
})

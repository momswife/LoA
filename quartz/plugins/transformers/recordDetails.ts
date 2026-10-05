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

// Match whole rows only: quoted discussion of a filing formula is not a footer.
function footerHeading(node: Element): boolean {
  const paragraphs = node.tagName === "blockquote" ? node.children : [node]
  return paragraphs.some(
    (p) =>
      isElement(p, "p") &&
      splitRows(p.children).some((row) =>
        /^Filed\s*(?:&|and)\s*Authenticated$/i.test(row.map(textContent).join("").trim()),
      ),
  )
}

function closingMarker(value: string): string | undefined {
  const clean = value.trim()
  if (/^[^\p{L}\p{N}]*END\s+OF\s+FILE[^\p{L}\p{N}]*$/iu.test(clean)) {
    return "MDO ARCHIVE · RECORD SEALED"
  }
  if (/^MDO\s+ARCHIVE\s*[·•]\s*(?:RECORD|INDEX)\s+[\p{L} -]+$/iu.test(clean)) {
    return clean
  }
  return undefined
}

function footerParagraphs(node: RootContent): Element[] {
  if (!isElement(node)) return []
  if (node.tagName === "p") return [node]
  if (node.tagName === "blockquote")
    return node.children.filter((p): p is Element => isElement(p, "p"))
  return []
}

function nodeClosingMarker(node: RootContent): string | undefined {
  for (const p of footerParagraphs(node)) {
    for (const row of splitRows(p.children)) {
      const marker = closingMarker(row.map(textContent).join(""))
      if (marker) return marker
    }
  }
  return undefined
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

function createFilingPanel(paragraphs: Element[]): Element[] {
  const headingIndex = paragraphs.findIndex(footerHeading)
  const heading = paragraphs[headingIndex]
  const fields: Element[] = []
  const offices: Element[] = []
  const notices: Element[] = []
  const seals: Element[] = []
  let hasFields = false
  for (const [index, p] of paragraphs.entries()) {
    if (index === headingIndex) continue
    if (nodeClosingMarker(p)) {
      seals.push(p)
      continue
    }
    const first = p.children.findIndex((child) => textContent(child).trim().length > 0)
    const label = p.children[first]
    const next = p.children[first + 1]
    const hasColon =
      isElement(label, "strong") &&
      (/:\s*$/.test(textContent(label)) || (next?.type === "text" && /^\s*:/.test(next.value)))
    if (hasColon && isElement(label)) {
      hasFields = true
      fields.push({
        type: "element",
        tagName: "div",
        properties: {},
        children: [
          {
            type: "element",
            tagName: "dt",
            properties: {},
            children: [{ type: "text", value: textContent(label).trim().replace(/:\s*$/, "") }],
          },
          {
            type: "element",
            tagName: "dd",
            properties: {},
            children: trimLeadingPunctuation(p.children.slice(first + 1)),
          },
        ],
      })
    } else if (!hasFields && !/^[—–]/u.test(textContent(p).trim())) {
      addClass(p, "record-file-footer__office")
      offices.push(p)
    } else {
      addClass(p, "record-file-footer__notice")
      notices.push(p)
    }
  }
  return [
    {
      type: "element",
      tagName: "div",
      properties: { className: ["record-file-footer__heading"] },
      children: [
        {
          type: "element",
          tagName: "span",
          properties: { className: ["record-file-footer__emblem"], ariaHidden: "true" },
          children: [{ type: "text", value: "MDO" }],
        },
        {
          type: "element",
          tagName: "div",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "p",
              properties: { className: ["record-file-footer__eyebrow"] },
              children: [{ type: "text", value: "Ministry Archive · Filing Record" }],
            },
            {
              type: "element",
              tagName: "p",
              properties: { className: ["record-file-footer__title"] },
              children: heading?.children ?? [],
            },
          ],
        },
      ],
    },
    ...offices,
    ...(fields.length
      ? [
          {
            type: "element",
            tagName: "dl",
            properties: { className: ["record-file-footer__fields"] },
            children: fields,
          } satisfies Element,
        ]
      : []),
    ...notices,
    ...seals,
  ]
}

function transformFooter(children: RootContent[]) {
  const footerStart = children.findLastIndex(
    (node) => isElement(node) && ["blockquote", "p"].includes(node.tagName) && footerHeading(node),
  )
  if (footerStart < 0) return

  // Never consume the next article section, code example, list, or table while
  // looking for a closing seal. Keep notices and inline markup intact.
  let footerEnd = footerStart
  let marker: string | undefined
  for (let index = footerStart; index < children.length; index++) {
    const node = children[index]
    if (isWhitespace(node)) continue
    if (!isElement(node) || !["p", "blockquote"].includes(node.tagName)) break
    const found = nodeClosingMarker(node)
    if (index > footerStart && !found) {
      const value = textContent(node).trim()
      const metadata = footerParagraphs(node).every((p) => Boolean(paragraphLabel(p)))
      if (!metadata && !/^[—–]/u.test(value)) break
    }
    footerEnd = index
    if (found) {
      marker = found
      break
    }
  }

  const paragraphs: Element[] = []
  for (const node of children.slice(footerStart, footerEnd + 1)) {
    for (const p of footerParagraphs(node)) {
      for (const row of splitRows(p.children)) {
        if (closingMarker(row.map(textContent).join(""))) continue
        const content = [...row]
        while (content.length && isWhitespace(content[0])) content.shift()
        while (content.length && isWhitespace(content[content.length - 1])) content.pop()
        paragraphs.push({ ...p, properties: structuredClone(p.properties), children: content })
      }
    }
  }
  if (marker) {
    paragraphs.push({
      type: "element",
      tagName: "p",
      properties: { className: ["record-file-footer__seal"] },
      children: [{ type: "text", value: marker }],
    })
  }
  children.splice(footerStart, footerEnd - footerStart + 1, {
    type: "element",
    tagName: "section",
    properties: { className: ["record-file-footer"], ariaLabel: "Record footer" },
    children: createFilingPanel(paragraphs),
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

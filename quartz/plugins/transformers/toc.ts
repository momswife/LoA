import { QuartzTransformerPlugin } from "../types"
import { Root } from "mdast"
import { visit } from "unist-util-visit"
import { toString } from "mdast-util-to-string"
import Slugger from "github-slugger"

export interface Options {
  maxDepth: 1 | 2 | 3 | 4 | 5 | 6
  minEntries: number
  showByDefault: boolean
  collapseByDefault: boolean
  filter: "all" | "romanNumeralSections"
}

const defaultOptions: Options = {
  maxDepth: 3,
  minEntries: 1,
  showByDefault: true,
  collapseByDefault: false,
  filter: "all",
}

interface TocEntry {
  depth: number
  text: string
  slug: string // this is just the anchor (#some-slug), not the canonical slug
}

const slugAnchor = new Slugger()
const romanNumeralHeading = /^(?=[IVX]+\b)[IVX]+\.\s+/i
const decorativeHeading = /^[\s━─—\-⭕⦿]+$/u

export const TableOfContents: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "TableOfContents",
    markdownPlugins() {
      return [
        () => {
          return async (tree: Root, file) => {
            const display = file.data.frontmatter?.enableToc ?? opts.showByDefault
            if (display) {
              slugAnchor.reset()
              const toc: TocEntry[] = []
              let highestDepth: number = opts.maxDepth
              let activeRomanSectionDepth: number | undefined
              let activeRomanChildBaseDepth: number | undefined
              visit(tree, "heading", (node) => {
                if (node.depth <= opts.maxDepth) {
                  const text = toString(node)
                  const entry = {
                    depth: node.depth,
                    text,
                    slug: slugAnchor.slug(text),
                  }

                  if (decorativeHeading.test(text)) {
                    return
                  }

                  if (opts.filter === "romanNumeralSections") {
                    const startsRomanSection = romanNumeralHeading.test(text)

                    if (startsRomanSection) {
                      activeRomanSectionDepth = node.depth
                      activeRomanChildBaseDepth = undefined
                      toc.push({ ...entry, depth: 0 })
                      return
                    } else if (
                      activeRomanSectionDepth !== undefined &&
                      node.depth <= activeRomanSectionDepth
                    ) {
                      activeRomanSectionDepth = undefined
                      activeRomanChildBaseDepth = undefined
                    }

                    if (activeRomanSectionDepth === undefined) {
                      return
                    }

                    activeRomanChildBaseDepth = Math.min(
                      activeRomanChildBaseDepth ?? node.depth,
                      node.depth,
                    )
                    toc.push({ ...entry, depth: node.depth - activeRomanChildBaseDepth + 1 })
                    return
                  }

                  highestDepth = Math.min(highestDepth, node.depth)
                  toc.push(entry)
                }
              })

              if (toc.length > 0 && toc.length > opts.minEntries) {
                file.data.toc =
                  opts.filter === "romanNumeralSections"
                    ? toc
                    : toc.map((entry) => ({
                        ...entry,
                        depth: entry.depth - highestDepth,
                      }))
                file.data.collapseToc = opts.collapseByDefault
              }
            }
          }
        },
      ]
    },
  }
}

declare module "vfile" {
  interface DataMap {
    toc: TocEntry[]
    collapseToc: boolean
  }
}

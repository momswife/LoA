import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { FullSlug } from "./quartz/util/path"
import type { ExplorerOptions } from "./.quartz/plugins/explorer/dist/index.js"

// @ts-ignore - Imported as source text by the Quartz inline-script loader.
import explorerAutoCollapseScript from "./quartz/components/scripts/explorer-auto-collapse.inline"

const siteExplorerOptions = {
  folderClickBehavior: "collapse",
  order: ["filter", "map", "sort"],
  mapFn: (node) => {
    const currentDisplayName = node.displayName ?? ""
    const isOverview =
      !node.isFolder &&
      (node.slugSegment === "overview" || /^∅(?:-|$)/.test(node.slugSegment ?? ""))
    const slugPrefix = (node.slugSegment ?? "").match(/^([IVXLCDM]+|\d+)\.(?:-|$)/i)?.[1]
    const displayPrefix = currentDisplayName.match(/^([IVXLCDM]+|\d+)\.\s+/i)?.[1]

    // Reader-facing titles may intentionally omit archival prefixes. Recover
    // each prefix from the slug without replacing the human-readable title.
    if (slugPrefix && !displayPrefix) {
      const normalizedPrefix = /^\d+$/.test(slugPrefix) ? slugPrefix : slugPrefix.toUpperCase()
      node.displayName = `${normalizedPrefix}. ${currentDisplayName}`
    }

    if (isOverview && !currentDisplayName.trimStart().startsWith("∅")) {
      node.displayName = node.slugSegment === "overview" ? "∅ Overview" : `∅ ${currentDisplayName}`
    }
    return node
  },
  sortFn: (a, b) => {
    const aIsOverview =
      !a.isFolder && (a.slugSegment === "overview" || /^∅(?:-|$)/.test(a.slugSegment ?? ""))
    const bIsOverview =
      !b.isFolder && (b.slugSegment === "overview" || /^∅(?:-|$)/.test(b.slugSegment ?? ""))
    if (aIsOverview !== bIsOverview) return aIsOverview ? -1 : 1
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1

    // This comparator is serialized into the browser. Keep its prefix parsing
    // inline so the emitted function has no references to module-scope helpers.
    const romanValues: Record<string, number> = {
      I: 1,
      V: 5,
      X: 10,
      L: 50,
      C: 100,
      D: 500,
      M: 1000,
    }

    const aMatch = (a.slugSegment ?? "").match(/^([IVXLCDM]+|\d+)\.(?:-|$)/i)
    let aOrder: number | undefined
    if (aMatch) {
      const token = aMatch[1].toUpperCase()
      if (/^\d+$/.test(token)) {
        aOrder = Number.parseInt(token, 10)
      } else {
        aOrder = 0
        for (let index = 0; index < token.length; index++) {
          const current = romanValues[token[index]] ?? 0
          const next = romanValues[token[index + 1]] ?? 0
          aOrder += current < next ? -current : current
        }
      }
    }

    const bMatch = (b.slugSegment ?? "").match(/^([IVXLCDM]+|\d+)\.(?:-|$)/i)
    let bOrder: number | undefined
    if (bMatch) {
      const token = bMatch[1].toUpperCase()
      if (/^\d+$/.test(token)) {
        bOrder = Number.parseInt(token, 10)
      } else {
        bOrder = 0
        for (let index = 0; index < token.length; index++) {
          const current = romanValues[token[index]] ?? 0
          const next = romanValues[token[index + 1]] ?? 0
          bOrder += current < next ? -current : current
        }
      }
    }

    if (aOrder !== undefined && bOrder !== undefined && aOrder !== bOrder) {
      return aOrder - bOrder
    }
    if ((aOrder === undefined) !== (bOrder === undefined)) {
      return aOrder === undefined ? 1 : -1
    }

    return (a.displayName ?? "").localeCompare(b.displayName ?? "", undefined, {
      numeric: true,
      sensitivity: "base",
    })
  },
} satisfies Partial<ExplorerOptions>

// Reuse one Explorer instance across content and list layouts so its lifecycle
// script is registered only once.
const siteExplorer = Component.Explorer(siteExplorerOptions)
siteExplorer.afterDOMLoaded = [siteExplorer.afterDOMLoaded, explorerAutoCollapseScript].flatMap(
  (resource) => resource ?? [],
)

const siteBreadcrumbOptions = {
  hideTopLevelFolder: false,
  disableFolderLinks: false,
  maxItems: 5,
  itemsBeforeCollapse: 2,
  itemsAfterCollapse: 2,
  labelMap: {
    "Aerathon Eternal Labyrinths": "Aerathon",
    "Aerathon - Eternal Labyrinths": "Aerathon",
    "II. The Living Atlas": "Living Atlas",
    "Cities, Isles & Towns": "Settlements",
    "Major Cities": "Cities",
  },
  pathMap: {
    "aerathon---eternal-labyrinths/i.-annals--and--antiquities":
      "aerathon---eternal-labyrinths/i.-annals--and--antiquities/overview" as FullSlug,
    "aerathon---eternal-labyrinths/ii.-the-living-atlas":
      "aerathon---eternal-labyrinths/ii.-the-living-atlas/overview" as FullSlug,
    "aerathon---eternal-labyrinths/iii.-monthly-ledger":
      "aerathon---eternal-labyrinths/iii.-monthly-ledger/overview" as FullSlug,
  },
}

const siteBreadcrumbs = Component.Breadcrumbs({
  ...siteBreadcrumbOptions,
  showCurrentPage: true,
})

const siteListBreadcrumbs = Component.Breadcrumbs({
  ...siteBreadcrumbOptions,
  showCurrentPage: true,
})

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    Component.PageTitle(),
    Component.Spacer(),
    Component.Search(),
    Component.SiteNav(),
    Component.Darkmode(),
    Component.ReaderMode(),
  ],
  afterBody: [Component.CategoryDirectory(), Component.RelatedRecords()],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/momswife/LoA",
      "Beast World": "https://thedelversguide.com/",
      "Quartz Engine": "https://quartz.jzhao.xyz/",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.SpoilerGate(),
    Component.ConditionalRender({
      component: siteBreadcrumbs,
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ConditionalRender({
      component: Component.ArticleTitle(),
      condition: (page) => page.fileData.slug === "index",
    }),
    Component.ConditionalRender({
      component: Component.ContentMeta(),
      condition: (page) => page.fileData.slug === "index",
    }),
    Component.ConditionalRender({
      component: Component.DocumentMasthead(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ConditionalRender({
      component: Component.HomeGateway(),
      condition: (page) => page.fileData.slug === "index",
    }),
    Component.ConditionalRender({
      component: Component.WorldwireFeed(),
      condition: (page) => page.fileData.slug === "index",
    }),
    Component.ConditionalRender({
      component: Component.MobileOnly(Component.TableOfContents()),
      condition: (page) => page.fileData.slug !== "index",
    }),
  ],
  left: [siteExplorer],
  right: [
    Component.ConditionalRender({
      component: Component.DesktopOnly(Component.TableOfContents()),
      condition: (page) => page.fileData.slug !== "index",
    }),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [siteListBreadcrumbs, Component.ArticleTitle(), Component.ContentMeta()],
  left: [siteExplorer],
  right: [],
}

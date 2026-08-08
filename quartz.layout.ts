import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { FullSlug } from "./quartz/util/path"
import type { ExplorerOptions } from "./.quartz/plugins/explorer/dist/index.js"

const siteExplorerOptions = {
  folderClickBehavior: "collapse",
  order: ["filter", "map", "sort"],
  mapFn: (node) => {
    if (!node.isFolder && node.slugSegment === "overview") {
      node.displayName = "∅ Overview"
    }
    return node
  },
  sortFn: (a, b) => {
    const aIsOverview = !a.isFolder && a.slugSegment === "overview"
    const bIsOverview = !b.isFolder && b.slugSegment === "overview"
    if (aIsOverview !== bIsOverview) return aIsOverview ? -1 : 1
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
    return (a.displayName ?? "").localeCompare(b.displayName ?? "", undefined, {
      numeric: true,
      sensitivity: "base",
    })
  },
} satisfies Partial<ExplorerOptions>

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
      "Quartz Engine": "https://quartz.jzhao.xyz/",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
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
  left: [
    Component.Explorer({
      ...siteExplorerOptions,
    }),
  ],
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
  left: [
    Component.Explorer({
      ...siteExplorerOptions,
    }),
  ],
  right: [],
}

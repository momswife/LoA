import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { FullSlug } from "./quartz/util/path"

const siteBreadcrumbOptions = {
  hideTopLevelFolder: false,
  disableFolderLinks: false,
  maxItems: 6,
  itemsBeforeCollapse: 3,
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
    Component.MobileOnly(Component.TableOfContents()),
  ],
  left: [
    Component.Explorer({
      folderClickBehavior: "collapse",
    }),
  ],
  right: [Component.DesktopOnly(Component.TableOfContents())],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [siteListBreadcrumbs, Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.Explorer({
      folderClickBehavior: "collapse",
    }),
  ],
  right: [],
}

import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

const siteBreadcrumbOptions = {
  hideTopLevelFolder: true,
  disableFolderLinks: true,
  maxItems: 5,
  itemsBeforeCollapse: 1,
  itemsAfterCollapse: 3,
  labelMap: {
    "Aerathon Eternal Labyrinths": "Aerathon",
    "Aerathon - Eternal Labyrinths": "Aerathon",
    "II. The Living Atlas": "Living Atlas",
    "Cities, Isles & Towns": "Settlements",
    "Major Cities": "Cities",
  },
}

const siteBreadcrumbs = Component.Breadcrumbs({
  ...siteBreadcrumbOptions,
  showCurrentPage: false,
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
  afterBody: [],
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
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
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

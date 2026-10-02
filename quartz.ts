import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { ShareLinks } from "./quartz/plugins/emitters/shareLinks"

// The YAML plugin registry owns component loading, while this project-level
// layout supplies the final arrangement and local components.
const authoredLayout = await import("./quartz.layout")
const contentPageLayout = {
  ...authoredLayout.sharedPageComponents,
  ...authoredLayout.defaultContentPageLayout,
}
const listPageLayout = {
  ...authoredLayout.sharedPageComponents,
  ...authoredLayout.defaultListPageLayout,
}
const layoutOverrides = {
  defaults: contentPageLayout,
  byPageType: {
    content: contentPageLayout,
    folder: listPageLayout,
    tag: listPageLayout,
  },
}

const config = await loadQuartzConfig(undefined, layoutOverrides)
config.plugins.emitters.push(ShareLinks())
export default config

export const layout = await loadQuartzLayout(layoutOverrides)

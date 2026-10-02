import { QuartzEmitterPlugin } from "../types"
import { validateShareLinks } from "../../util/shareLinks"

// Runs against published content, including generated folder and tag pages.
// An exception stops the build before it can be deployed.
export const ShareLinks: QuartzEmitterPlugin = () => ({
  name: "ShareLinks",
  async emit(_ctx, content) {
    validateShareLinks(content.map(([, file]) => ({ ...file.data, slug: file.data.slug! })))
    return []
  },
})

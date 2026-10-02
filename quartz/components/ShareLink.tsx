import { QuartzComponent, QuartzComponentConstructor } from "./types"
import { shareAddress } from "../util/shareLinks"
// @ts-ignore -- bundled as browser source by Quartz
import script from "./scripts/share-link.inline"
import style from "./styles/shareLink.scss"

export default (() => {
  const ShareLink: QuartzComponent = ({ cfg, fileData }) => {
    const permalink = fileData.frontmatter?.permalink
    if (!cfg.baseUrl || typeof permalink !== "string") return null
    const address = shareAddress(cfg.baseUrl, permalink)
    return (
      <div class="share-link">
        <button
          type="button"
          data-share-url={address}
          aria-label="Copy short link to this article"
          title="Copy link"
        >
          <svg
            class="share-link-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7" />
            <path d="M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7" />
          </svg>
          <svg
            class="share-link-check"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>
        </button>
        <span class="share-link-status" role="status" aria-live="polite" />
        <input aria-label="Short link to copy manually" value={address} readOnly hidden />
      </div>
    )
  }
  ShareLink.afterDOMLoaded = script
  ShareLink.css = style
  return ShareLink
}) satisfies QuartzComponentConstructor

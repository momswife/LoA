// Re-export shared path utilities from @quartz-community/utils
import {
  endsWith as quartzEndsWith,
  getFileExtension as quartzGetFileExtension,
  stripSlashes as quartzStripSlashes,
} from "@quartz-community/utils"
import type {
  FilePath as QuartzFilePath,
  FullSlug as QuartzFullSlug,
} from "@quartz-community/utils"

export {
  isFilePath,
  isFullSlug,
  isSimpleSlug,
  isRelativeURL,
  isAbsoluteURL,
  getFullSlug,
  slugifyFilePath,
  simplifySlug,
  joinSegments,
  endsWith,
  trimSuffix,
  stripSlashes,
  getFileExtension,
  isFolderPath,
  getAllSegmentPrefixes,
  pathToRoot,
  resolveRelative,
  splitAnchor,
  slugTag,
  transformInternalLink,
  transformLink,
  normalizeHastElement,
} from "@quartz-community/utils"

export type {
  FilePath,
  FullSlug,
  SimpleSlug,
  RelativeURL,
  TransformOptions,
} from "@quartz-community/utils"

// --- v5-specific exports below ---

export const QUARTZ = "quartz"

function legacySluggify(s: string): string {
  return s
    .split("/")
    .map((segment) =>
      segment
        .replace(/\s/g, "-")
        .replace(/&/g, "-and-")
        .replace(/%/g, "-percent")
        .replace(/\?/g, "")
        .replace(/#/g, ""),
    )
    .join("/") // always use / as sep
    .replace(/\/$/, "")
}

/** Generate redirects for URLs produced by Lore Vault's pre-v5 slugger. */
export function legacySlugifyFilePath(
  fp: QuartzFilePath,
  excludeExt?: boolean,
): QuartzFullSlug {
  fp = quartzStripSlashes(fp) as QuartzFilePath
  let ext = quartzGetFileExtension(fp)
  const withoutFileExt = fp.replace(new RegExp(ext + "$"), "")
  if (excludeExt || [".md", ".html", undefined].includes(ext)) {
    ext = ""
  }

  let slug = legacySluggify(withoutFileExt)

  // treat _index as index
  if (quartzEndsWith(slug, "_index")) {
    slug = slug.replace(/_index$/, "index")
  }

  return (slug + ext) as QuartzFullSlug
}

// from micromorph/src/utils.ts
// https://github.com/natemoo-re/micromorph/blob/main/src/utils.ts#L5
const _rebaseHtmlElement = (el: Element, attr: string, newBase: string | URL) => {
  const rebased = new URL(el.getAttribute(attr)!, newBase)
  el.setAttribute(attr, rebased.pathname + rebased.hash)
}
export function normalizeRelativeURLs(el: Element | Document, destination: string | URL) {
  el.querySelectorAll('[href=""], [href^="./"], [href^="../"]').forEach((item) => {
    _rebaseHtmlElement(item, "href", destination)
  })
  el.querySelectorAll('[src=""], [src^="./"], [src^="../"]').forEach((item) => {
    _rebaseHtmlElement(item, "src", destination)
  })
}

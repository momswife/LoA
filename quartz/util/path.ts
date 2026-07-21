// Re-export shared path utilities from @quartz-community/utils
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

<<<<<<< HEAD
/// Utility type to simulate nominal types in TypeScript
type SlugLike<T> = string & { __brand: T }

/** Cannot be relative and must have a file extension. */
export type FilePath = SlugLike<"filepath">
export function isFilePath(s: string): s is FilePath {
  const validStart = !s.startsWith(".")
  return validStart && _hasFileExtension(s)
}

/** Cannot be relative and may not have leading or trailing slashes. It can have `index` as it's last segment. Use this wherever possible is it's the most 'general' interpretation of a slug. */
export type FullSlug = SlugLike<"full">
export function isFullSlug(s: string): s is FullSlug {
  const validStart = !(s.startsWith(".") || s.startsWith("/"))
  const validEnding = !s.endsWith("/")
  return validStart && validEnding && !containsForbiddenCharacters(s)
}

/** Shouldn't be a relative path and shouldn't have `/index` as an ending or a file extension. It _can_ however have a trailing slash to indicate a folder path. */
export type SimpleSlug = SlugLike<"simple">
export function isSimpleSlug(s: string): s is SimpleSlug {
  const validStart = !(s.startsWith(".") || (s.length > 1 && s.startsWith("/")))
  const validEnding = !endsWith(s, "index")
  return validStart && !containsForbiddenCharacters(s) && validEnding && !_hasFileExtension(s)
}

/** Can be found on `href`s but can also be constructed for client-side navigation (e.g. search and graph) */
export type RelativeURL = SlugLike<"relative">
export function isRelativeURL(s: string): s is RelativeURL {
  const validStart = /^\.{1,2}/.test(s)
  const validEnding = !endsWith(s, "index")
  return validStart && validEnding && ![".md", ".html"].includes(getFileExtension(s) ?? "")
}

export function isAbsoluteURL(s: string): boolean {
  try {
    new URL(s)
  } catch {
    return false
  }
  return true
}

export function getFullSlug(window: Window): FullSlug {
  const res = window.document.body.dataset.slug! as FullSlug
  return res
}

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

function sluggify(s: string): string {
  return legacySluggify(s)
    .split("/")
    .map((segment) => segment.replace(/-+/g, "-").replace(/^-|-$/g, ""))
    .join("/")
}

function _slugifyFilePath(
  fp: FilePath,
  excludeExt: boolean | undefined,
  slugger: (s: string) => string,
): FullSlug {
  fp = stripSlashes(fp) as FilePath
  let ext = getFileExtension(fp)
  const withoutFileExt = fp.replace(new RegExp(ext + "$"), "")
  if (excludeExt || [".md", ".html", undefined].includes(ext)) {
    ext = ""
  }

  let slug = slugger(withoutFileExt)

  // treat _index as index
  if (endsWith(slug, "_index")) {
    slug = slug.replace(/_index$/, "index")
  }

  return (slug + ext) as FullSlug
}

export function slugifyFilePath(fp: FilePath, excludeExt?: boolean): FullSlug {
  return _slugifyFilePath(fp, excludeExt, sluggify)
}

export function legacySlugifyFilePath(fp: FilePath, excludeExt?: boolean): FullSlug {
  return _slugifyFilePath(fp, excludeExt, legacySluggify)
}

export function simplifySlug(fp: FullSlug): SimpleSlug {
  const res = stripSlashes(trimSuffix(fp, "index"), true)
  return (res.length === 0 ? "/" : res) as SimpleSlug
}

export function transformInternalLink(link: string): RelativeURL {
  let [fplike, anchor] = splitAnchor(decodeURI(link))

  const folderPath = isFolderPath(fplike)
  let segments = fplike.split("/").filter((x) => x.length > 0)
  let prefix = segments.filter(isRelativeSegment).join("/")
  let fp = segments.filter((seg) => !isRelativeSegment(seg) && seg !== "").join("/")

  // manually add ext here as we want to not strip 'index' if it has an extension
  const simpleSlug = simplifySlug(slugifyFilePath(fp as FilePath))
  const joined = joinSegments(stripSlashes(prefix), stripSlashes(simpleSlug))
  const trail = folderPath ? "/" : ""
  const res = (_addRelativeToStart(joined) + trail + anchor) as RelativeURL
  return res
}

=======
>>>>>>> v5
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

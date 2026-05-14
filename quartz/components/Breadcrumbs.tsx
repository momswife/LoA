import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import breadcrumbsStyle from "./styles/breadcrumbs.scss"
import { FullSlug, SimpleSlug, resolveRelative, simplifySlug } from "../util/path"
import { classNames } from "../util/lang"
import { trieFromAllFiles } from "../util/ctx"

type CrumbData = {
  displayName: string
  path: string
  isFolder?: boolean
  isRoot?: boolean
  isCollapsed?: boolean
  isCurrent?: boolean
}

interface BreadcrumbOptions {
  /**
   * Symbol between crumbs
   */
  spacerSymbol: string
  /**
   * Name of first crumb
   */
  rootName: string
  /**
   * Whether to look up frontmatter title for folders (could cause performance problems with big vaults)
   */
  resolveFrontmatterTitle: boolean
  /**
   * Whether to display the current page in the breadcrumbs.
   */
  showCurrentPage: boolean
  /**
   * Whether to hide the first folder below Home.
   */
  hideTopLevelFolder: boolean
  /**
   * Whether folder crumbs should render as text instead of links.
   */
  disableFolderLinks: boolean
  /**
   * Maximum number of visible breadcrumb items before middle crumbs collapse.
   */
  maxItems?: number
  /**
   * Number of crumbs to keep before the collapsed middle segment.
   */
  itemsBeforeCollapse: number
  /**
   * Number of crumbs to keep after the collapsed middle segment.
   */
  itemsAfterCollapse: number
  /**
   * Label for collapsed middle crumbs.
   */
  collapseLabel: string
  /**
   * Short labels for specific crumb paths or display names.
   */
  labelMap: Record<string, string>
}

const defaultOptions: BreadcrumbOptions = {
  spacerSymbol: ">",
  rootName: "Home",
  resolveFrontmatterTitle: true,
  showCurrentPage: true,
  hideTopLevelFolder: false,
  disableFolderLinks: false,
  maxItems: undefined,
  itemsBeforeCollapse: 1,
  itemsAfterCollapse: 2,
  collapseLabel: "...",
  labelMap: {},
}

function getBreadcrumbTitle(
  displayName: string,
  frontmatterTitle: unknown,
  labelMap: Record<string, string>,
  currentSlug: SimpleSlug,
): string {
  const fallbackName = displayName.replaceAll("-", " ")
  const frontmatterName = typeof frontmatterTitle === "string" ? frontmatterTitle : undefined

  return (
    labelMap[currentSlug] ??
    labelMap[displayName] ??
    labelMap[fallbackName] ??
    frontmatterName ??
    fallbackName
  )
}

function formatCrumb(
  displayName: string,
  frontmatterTitle: unknown,
  baseSlug: FullSlug,
  currentSlug: SimpleSlug,
  labelMap: Record<string, string>,
): CrumbData {
  return {
    displayName: getBreadcrumbTitle(displayName, frontmatterTitle, labelMap, currentSlug),
    path: resolveRelative(baseSlug, currentSlug),
  }
}

function collapseCrumbs(crumbs: CrumbData[], options: BreadcrumbOptions): CrumbData[] {
  const maxItems = options.maxItems
  if (!maxItems || crumbs.length <= maxItems) {
    return crumbs
  }

  const itemsBefore = Math.max(1, options.itemsBeforeCollapse)
  const itemsAfter = Math.max(1, options.itemsAfterCollapse)
  if (itemsBefore + itemsAfter >= crumbs.length) {
    return crumbs
  }

  return [
    ...crumbs.slice(0, itemsBefore),
    {
      displayName: options.collapseLabel,
      path: "",
      isFolder: false,
      isCollapsed: true,
    },
    ...crumbs.slice(-itemsAfter),
  ]
}

export default ((opts?: Partial<BreadcrumbOptions>) => {
  const options: BreadcrumbOptions = { ...defaultOptions, ...opts }
  const Breadcrumbs: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
    ctx,
  }: QuartzComponentProps) => {
    const trie = (ctx.trie ??= trieFromAllFiles(allFiles))
    const slugParts = fileData.slug!.split("/")
    const pathNodes = trie.ancestryChain(slugParts)

    if (!pathNodes) {
      return null
    }

    const crumbs: CrumbData[] = pathNodes.map((node, idx) => {
      const frontmatterTitle = options.resolveFrontmatterTitle
        ? node.data?.frontmatter?.breadcrumbTitle
        : undefined
      const crumb = formatCrumb(
        node.displayName,
        frontmatterTitle,
        fileData.slug!,
        simplifySlug(node.slug),
        options.labelMap,
      )
      if (idx === 0) {
        crumb.displayName = options.rootName
        crumb.isRoot = true
      }

      crumb.isFolder = node.isFolder

      // For last node (current page), set empty path
      if (idx === pathNodes.length - 1) {
        crumb.path = ""
        crumb.isCurrent = true
      }

      return crumb
    })

    if (!options.showCurrentPage) {
      crumbs.pop()
    }
    if (options.hideTopLevelFolder && crumbs.length > 1) {
      crumbs.splice(1, 1)
    }

    const visibleCrumbs = collapseCrumbs(crumbs, options)

    return (
      <nav class={classNames(displayClass, "breadcrumb-container")} aria-label="breadcrumbs">
        {visibleCrumbs.map((crumb, index) => (
          <div
            class={[
              "breadcrumb-element",
              crumb.isCollapsed ? "collapsed" : undefined,
              crumb.isCurrent ? "current" : undefined,
            ]
              .filter((c): c is string => Boolean(c))
              .join(" ")}
          >
            {crumb.path && (!options.disableFolderLinks || !crumb.isFolder || crumb.isRoot) ? (
              <a href={crumb.path}>{crumb.displayName}</a>
            ) : (
              <span aria-current={crumb.isCurrent ? "page" : undefined}>{crumb.displayName}</span>
            )}
            {index !== visibleCrumbs.length - 1 && <p>{` ${options.spacerSymbol} `}</p>}
          </div>
        ))}
      </nav>
    )
  }
  Breadcrumbs.css = breadcrumbsStyle

  return Breadcrumbs
}) satisfies QuartzComponentConstructor

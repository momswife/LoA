import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { BuildTimeTrieData, trieFromAllFiles } from "../util/ctx"
import { FileTrieNode } from "../util/fileTrie"
import { FullSlug, resolveRelative, simplifySlug } from "../util/path"
import style from "./styles/categoryDirectory.scss"

type DirectoryNode = FileTrieNode<BuildTimeTrieData>

function sortedChildren(node: DirectoryNode): DirectoryNode[] {
  return [...node.children]
    .filter((child) => child.slugSegment !== "overview")
    .sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    )
}

function recordCount(node: DirectoryNode): number {
  if (!node.isFolder) return 1
  return sortedChildren(node).reduce((total, child) => total + recordCount(child), 0)
}

function nodeHref(currentSlug: FullSlug, node: DirectoryNode): string {
  return resolveRelative(currentSlug, simplifySlug(node.slug))
}

function FileLink({ node, currentSlug }: { node: DirectoryNode; currentSlug: FullSlug }) {
  return (
    <li class="category-directory__record">
      <a class="internal" href={nodeHref(currentSlug, node)}>
        <span aria-hidden="true">◇</span>
        {node.displayName}
      </a>
    </li>
  )
}

function FolderGroup({
  node,
  currentSlug,
  depth,
}: {
  node: DirectoryNode
  currentSlug: FullSlug
  depth: number
}) {
  const children = sortedChildren(node)
  const count = recordCount(node)

  return (
    <details class="category-directory__group" open={depth > 0 && count <= 8}>
      <summary>
        <span class="category-directory__summary-copy">
          <strong>{node.displayName}</strong>
          <span>
            {count} {count === 1 ? "record" : "records"}
          </span>
        </span>
        <span class="category-directory__toggle" aria-hidden="true" />
      </summary>
      <div class="category-directory__contents">
        <a class="category-directory__open internal" href={nodeHref(currentSlug, node)}>
          Open category
          <span aria-hidden="true">→</span>
        </a>
        <ul>
          {children.map((child) =>
            child.isFolder ? (
              <li class="category-directory__nested">
                <FolderGroup node={child} currentSlug={currentSlug} depth={depth + 1} />
              </li>
            ) : (
              <FileLink node={child} currentSlug={currentSlug} />
            ),
          )}
        </ul>
      </div>
    </details>
  )
}

export default (() => {
  const CategoryDirectory: QuartzComponent = ({
    fileData,
    allFiles,
    ctx,
  }: QuartzComponentProps) => {
    const currentSlug = fileData.slug
    if (!currentSlug?.endsWith("/overview")) return null

    const parentSlug = currentSlug.slice(0, -"/overview".length) as FullSlug
    const trie = (ctx.trie ??= trieFromAllFiles(allFiles))
    const parentNode = trie.findNode(parentSlug.split("/"))
    if (!parentNode) return null

    const categories = sortedChildren(parentNode).filter((child) => child.isFolder)
    const looseRecords = sortedChildren(parentNode).filter((child) => !child.isFolder)
    const totalRecords =
      categories.reduce((total, child) => total + recordCount(child), 0) + looseRecords.length
    if (totalRecords === 0) return null

    return (
      <section class="category-directory" aria-labelledby="category-directory-title">
        <header class="category-directory__heading">
          <div>
            <p>Division directory</p>
            <h2 id="category-directory-title">Browse the Collection</h2>
          </div>
          <span>
            {categories.length} {categories.length === 1 ? "category" : "categories"} ·{" "}
            {totalRecords} {totalRecords === 1 ? "record" : "records"}
          </span>
        </header>
        <div class="category-directory__grid">
          {categories.map((category) => (
            <FolderGroup node={category} currentSlug={currentSlug} depth={0} />
          ))}
        </div>
        {looseRecords.length > 0 && (
          <div class="category-directory__loose-records">
            <h3>Division Records</h3>
            <ul>
              {looseRecords.map((record) => (
                <FileLink node={record} currentSlug={currentSlug} />
              ))}
            </ul>
          </div>
        )}
      </section>
    )
  }

  CategoryDirectory.css = style
  return CategoryDirectory
}) satisfies QuartzComponentConstructor

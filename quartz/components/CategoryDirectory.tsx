import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { BuildTimeTrieData, trieFromAllFiles } from "../util/ctx"
import { FileTrieNode } from "../util/fileTrie"
import { FullSlug, resolveRelative, simplifySlug } from "../util/path"
import style from "./styles/categoryDirectory.scss"

// @ts-ignore
import script from "./scripts/categoryDirectory.inline"

type DirectoryNode = FileTrieNode<BuildTimeTrieData>
type RecordGroup = {
  title: string
  files: DirectoryNode[]
}

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

function dialogId(node: DirectoryNode): string {
  return `category-dialog-${node.slugSegment.replace(/[^a-z0-9_-]/gi, "-")}`
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

function collectRecordGroups(node: DirectoryNode, parents: string[] = []): RecordGroup[] {
  const children = sortedChildren(node)
  const directFiles = children.filter((child) => !child.isFolder)
  const groups: RecordGroup[] = []

  if (directFiles.length > 0) {
    groups.push({
      title: parents.length > 0 ? parents.join(" / ") : "Files",
      files: directFiles,
    })
  }

  for (const folder of children.filter((child) => child.isFolder)) {
    groups.push(...collectRecordGroups(folder, [...parents, folder.displayName]))
  }

  return groups
}

function RecordGroupView({ group, currentSlug }: { group: RecordGroup; currentSlug: FullSlug }) {
  return (
    <section class="category-dialog__group">
      <header>
        <h4>{group.title}</h4>
        <span>
          {group.files.length} {group.files.length === 1 ? "file" : "files"}
        </span>
      </header>
      <ul class="category-dialog__records">
        {group.files.map((file) => (
          <FileLink node={file} currentSlug={currentSlug} />
        ))}
      </ul>
    </section>
  )
}

function CategoryLauncher({ node, currentSlug }: { node: DirectoryNode; currentSlug: FullSlug }) {
  const id = dialogId(node)
  const count = recordCount(node)
  const groups = collectRecordGroups(node)

  return (
    <div class="category-directory__entry">
      <button
        type="button"
        class="category-directory__launcher"
        data-category-dialog-open={id}
        aria-haspopup="dialog"
        aria-controls={id}
      >
        <span class="category-directory__summary-copy">
          <strong>{node.displayName}</strong>
          <span>
            {count} {count === 1 ? "record" : "records"}
          </span>
        </span>
        <span class="category-directory__more" aria-hidden="true">
          ···
        </span>
      </button>
      <dialog class="category-dialog" id={id} aria-labelledby={`${id}-title`}>
        <div class="category-dialog__shell">
          <header class="category-dialog__header">
            <div>
              <p>Category directory</p>
              <h3 id={`${id}-title`}>{node.displayName}</h3>
              <span>
                {count} {count === 1 ? "record" : "records"}
              </span>
            </div>
            <button
              type="button"
              class="category-dialog__close"
              data-category-dialog-close
              aria-label={`Close ${node.displayName}`}
            >
              ×
            </button>
          </header>
          <div class="category-dialog__body">
            {groups.length > 0 ? (
              <div class="category-dialog__groups">
                {groups.map((group) => (
                  <RecordGroupView group={group} currentSlug={currentSlug} />
                ))}
              </div>
            ) : (
              <p class="category-dialog__empty">No records have been filed in this category yet.</p>
            )}
          </div>
        </div>
      </dialog>
    </div>
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
    if (categories.length === 0 && looseRecords.length === 0) return null

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
            <CategoryLauncher node={category} currentSlug={currentSlug} />
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
  CategoryDirectory.afterDOMLoaded = script
  return CategoryDirectory
}) satisfies QuartzComponentConstructor

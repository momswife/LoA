import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FilePath, FullSlug, resolveRelative, slugifyFilePath } from "../util/path"
import style from "./styles/relatedRecords.scss"

type RelatedSpec =
  | string
  | {
      link?: string
      slug?: string
      title?: string
      description?: string
    }

type RelatedRecord = {
  slug: FullSlug
  title: string
  description?: string
  type?: string
}

function cleanTarget(target: string): { target: string; label?: string } {
  const wikiMatch = target.match(/^\[\[(.*?)(?:\|(.*?))?\]\]$/)
  if (wikiMatch) return { target: wikiMatch[1], label: wikiMatch[2] }
  return { target }
}

function targetSlug(target: string): FullSlug {
  const withoutExtension = target.replace(/\.md$/i, "")
  return slugifyFilePath(`${withoutExtension}.md` as FilePath)
}

function titleFor(file: QuartzComponentProps["fileData"]): string {
  const title = file.frontmatter?.title
  return typeof title === "string" ? title : (file.slug?.split("/").at(-1) ?? "Untitled Record")
}

function descriptionFor(file: QuartzComponentProps["fileData"]): string | undefined {
  const description = file.frontmatter?.summary ?? file.frontmatter?.description ?? file.description
  return typeof description === "string" ? description : undefined
}

function typeFor(file: QuartzComponentProps["fileData"]): string | undefined {
  const type = file.frontmatter?.recordType
  return typeof type === "string" ? type : undefined
}

function resolveExplicitRecords(
  specs: RelatedSpec[],
  allFiles: QuartzComponentProps["allFiles"],
  currentSlug: FullSlug,
): RelatedRecord[] {
  return specs.flatMap((spec) => {
    const rawTarget = typeof spec === "string" ? spec : (spec.link ?? spec.slug)
    if (!rawTarget) return []
    const { target, label } = cleanTarget(rawTarget)
    const normalized = targetSlug(target)
    const file = allFiles.find(
      (candidate) =>
        candidate.slug === normalized ||
        candidate.slug === target ||
        candidate.frontmatter?.title === target,
    )
    if (!file?.slug || file.slug === currentSlug) return []

    return [
      {
        slug: file.slug,
        title: (typeof spec === "object" && spec.title) || label || titleFor(file),
        description: (typeof spec === "object" && spec.description) || descriptionFor(file),
        type: typeFor(file),
      },
    ]
  })
}

function siblingRecords(
  allFiles: QuartzComponentProps["allFiles"],
  currentSlug: FullSlug,
): RelatedRecord[] {
  const slashIndex = currentSlug.lastIndexOf("/")
  if (slashIndex < 0) return []
  const parent = currentSlug.slice(0, slashIndex)
  const prefix = `${parent}/`

  const siblings = allFiles
    .filter((candidate) => {
      if (!candidate.slug || candidate.slug === currentSlug || !candidate.slug.startsWith(prefix)) {
        return false
      }
      const remainder = candidate.slug.slice(prefix.length)
      return !remainder.includes("/") && remainder !== "index" && remainder !== "overview"
    })
    .sort((a, b) => titleFor(a).localeCompare(titleFor(b), undefined, { numeric: true }))

  return siblings.slice(0, 3).map((file) => ({
    slug: file.slug!,
    title: titleFor(file),
    description: descriptionFor(file),
    type: typeFor(file),
  }))
}

export default (() => {
  const RelatedRecords: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
    const currentSlug = fileData.slug
    if (!currentSlug || currentSlug === "index" || currentSlug.endsWith("/index")) return null

    const rawRelated = fileData.frontmatter?.related ?? fileData.frontmatter?.relatedRecords
    const specs = Array.isArray(rawRelated)
      ? (rawRelated as RelatedSpec[])
      : rawRelated
        ? ([rawRelated] as RelatedSpec[])
        : []
    const explicit = resolveExplicitRecords(specs, allFiles, currentSlug)
    const records = (explicit.length > 0 ? explicit : siblingRecords(allFiles, currentSlug)).slice(
      0,
      3,
    )
    if (records.length === 0) return null

    return (
      <section class="related-records" aria-labelledby="related-records-title">
        <div class="related-records__heading">
          <p>Continue exploring</p>
          <h2 id="related-records-title">Related Records</h2>
        </div>
        <div class="related-records__grid">
          {records.map((record) => (
            <a
              class="related-records__card internal"
              href={resolveRelative(currentSlug, record.slug)}
            >
              <span>{record.type ?? "Archive record"}</span>
              <strong>{record.title}</strong>
              {record.description && <p>{record.description}</p>}
            </a>
          ))}
        </div>
      </section>
    )
  }

  RelatedRecords.css = style
  return RelatedRecords
}) satisfies QuartzComponentConstructor

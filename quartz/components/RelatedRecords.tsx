import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FilePath, FullSlug, resolveRelative, simplifySlug, slugifyFilePath } from "../util/path"
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

function toRelatedRecord(file: QuartzComponentProps["fileData"]): RelatedRecord | undefined {
  if (!file.slug) return undefined

  return {
    slug: file.slug,
    title: titleFor(file),
    description: descriptionFor(file),
    type: typeFor(file),
  }
}

function linkedRecords(
  fileData: QuartzComponentProps["fileData"],
  allFiles: QuartzComponentProps["allFiles"],
  currentSlug: FullSlug,
): RelatedRecord[] {
  const links = Array.isArray(fileData.links) ? fileData.links : []

  return links.flatMap((link) => {
    const file = allFiles.find(
      (candidate) =>
        candidate.unlisted !== true &&
        candidate.slug !== currentSlug &&
        candidate.slug !== undefined &&
        simplifySlug(candidate.slug) === link,
    )
    const record = file ? toRelatedRecord(file) : undefined
    return record ? [record] : []
  })
}

function backlinkRecords(
  allFiles: QuartzComponentProps["allFiles"],
  currentSlug: FullSlug,
): RelatedRecord[] {
  const simpleCurrentSlug = simplifySlug(currentSlug)

  return allFiles.flatMap((file) => {
    if (!file.slug || file.slug === currentSlug || file.unlisted === true) return []
    const links = Array.isArray(file.links) ? file.links : []
    const record = links.includes(simpleCurrentSlug) ? toRelatedRecord(file) : undefined
    return record ? [record] : []
  })
}

function pathRelationship(firstSlug: FullSlug, secondSlug: FullSlug) {
  const first = firstSlug.split("/").slice(0, -1)
  const second = secondSlug.split("/").slice(0, -1)
  let sharedDepth = 0

  while (sharedDepth < first.length && first[sharedDepth] === second[sharedDepth]) {
    sharedDepth += 1
  }

  return {
    sharedDepth,
    distance: first.length + second.length - sharedDepth * 2,
  }
}

function nearbyRecords(
  allFiles: QuartzComponentProps["allFiles"],
  currentSlug: FullSlug,
): RelatedRecord[] {
  const candidates = allFiles.filter((file) => {
    if (!file.slug || file.slug === currentSlug || file.unlisted === true) return false
    const finalSegment = file.slug.split("/").at(-1)
    return finalSegment !== "index" && finalSegment !== "overview"
  })

  candidates.sort((first, second) => {
    const firstRelationship = pathRelationship(currentSlug, first.slug!)
    const secondRelationship = pathRelationship(currentSlug, second.slug!)
    if (firstRelationship.sharedDepth !== secondRelationship.sharedDepth) {
      return secondRelationship.sharedDepth - firstRelationship.sharedDepth
    }
    if (firstRelationship.distance !== secondRelationship.distance) {
      return firstRelationship.distance - secondRelationship.distance
    }
    return titleFor(first).localeCompare(titleFor(second), undefined, { numeric: true })
  })

  return candidates.flatMap((file) => {
    const record = toRelatedRecord(file)
    return record ? [record] : []
  })
}

function prioritizeRecords(groups: RelatedRecord[][], limit: number): RelatedRecord[] {
  const seen = new Set<FullSlug>()
  const records: RelatedRecord[] = []

  for (const group of groups) {
    for (const record of group) {
      if (seen.has(record.slug)) continue
      seen.add(record.slug)
      records.push(record)
      if (records.length === limit) return records
    }
  }

  return records
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
    const linked = linkedRecords(fileData, allFiles, currentSlug)
    const explicit = resolveExplicitRecords(specs, allFiles, currentSlug)
    const backlinks = backlinkRecords(allFiles, currentSlug)
    const nearby = nearbyRecords(allFiles, currentSlug)
    const records = prioritizeRecords([linked, explicit, backlinks, nearby], 3)
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

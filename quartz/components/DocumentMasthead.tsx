import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { FilePath, FullSlug, resolveRelative, slugifyFilePath } from "../util/path"
import { ContentMeta } from "../../.quartz/plugins/content-meta/dist/index.js"
import style from "./styles/documentMasthead.scss"

type Fact = {
  label: string
  value: string
}

type MastheadFrontmatter = Record<string, unknown> & {
  title?: string
  summary?: string
  description?: string
  division?: string
  recordType?: string
  status?: string
  classification?: string
  revision?: string | number
  hero?: string
  banner?: string
  heroAlt?: string
  tags?: unknown
  facts?: unknown
  keyFacts?: unknown
  showMastheadRecord?: boolean
}

const ContentMetadata = ContentMeta({
  showReadingTime: true,
  showComma: true,
}) as unknown as QuartzComponent

function textValue(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") return String(value)
  if (Array.isArray(value)) {
    const values = value.map(textValue).filter((item): item is string => Boolean(item))
    return values.length > 0 ? values.join(", ") : undefined
  }
  return undefined
}

function normalizeFacts(value: unknown): Fact[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return []
      const item = entry as Record<string, unknown>
      const label = textValue(item.label ?? item.name)
      const factValue = textValue(item.value ?? item.text)
      return label && factValue ? [{ label, value: factValue }] : []
    })
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([label, rawValue]) => {
      const factValue = textValue(rawValue)
      return factValue ? [{ label, value: factValue }] : []
    })
  }

  return []
}

function normalizeTags(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : []
  return values.flatMap((tag) => {
    const normalized = textValue(tag)?.trim()
    return normalized ? [normalized] : []
  })
}

function inferDivision(slug: string): string | undefined {
  const normalized = slug.toLowerCase()
  if (normalized.includes("i.-annals--and--antiquities")) return "Annals & Antiquities"
  if (normalized.includes("ii.-the-living-atlas")) return "The Living Atlas"
  if (normalized.includes("iii.-monthly-ledger")) return "Monthly Ledger"
  return undefined
}

function resolveHero(currentSlug: FullSlug, hero: string): string {
  if (/^(?:https?:)?\/\//.test(hero) || hero.startsWith("/")) return hero
  return resolveRelative(currentSlug, slugifyFilePath(hero as FilePath))
}

export default (() => {
  const DocumentMasthead: QuartzComponent = (props: QuartzComponentProps) => {
    const { fileData, displayClass } = props
    const frontmatter = (fileData.frontmatter ?? {}) as MastheadFrontmatter
    const title = textValue(frontmatter.title)
    if (!title) return null
    const isOverview = fileData.slug?.endsWith("/overview") ?? false

    // Only authored summaries belong in the masthead. The generated description
    // often contains the opening quote and filing block, duplicating the article.
    const summary = textValue(frontmatter.summary ?? frontmatter.description)
    const recordLabels = [
      textValue(frontmatter.division) ?? inferDivision(fileData.slug ?? ""),
      textValue(frontmatter.recordType),
      textValue(frontmatter.status),
    ].filter((badge, index, all): badge is string => Boolean(badge) && all.indexOf(badge) === index)
    const tags = normalizeTags(frontmatter.tags).filter(
      (tag) => !recordLabels.some((label) => label.toLowerCase() === tag.toLowerCase()),
    )

    const facts = normalizeFacts(frontmatter.facts ?? frontmatter.keyFacts)
    const showMastheadRecord = frontmatter.showMastheadRecord !== false
    const classification = textValue(frontmatter.classification)
    const revision = textValue(frontmatter.revision)
    if (classification && !facts.some((fact) => fact.label.toLowerCase() === "classification")) {
      facts.push({ label: "Classification", value: classification })
    }
    if (revision && !facts.some((fact) => fact.label.toLowerCase() === "revision")) {
      facts.push({ label: "Revision", value: revision })
    }

    const hero = textValue(frontmatter.hero ?? frontmatter.banner)

    return (
      <header
        class={classNames(displayClass, "document-masthead")}
        data-status={textValue(frontmatter.status)?.toLowerCase().replaceAll(" ", "-")}
      >
        {(recordLabels.length > 0 || tags.length > 0) && (
          <div class="document-masthead__badges" aria-label="Record labels and tags">
            {recordLabels.map((label) => (
              <span>{label}</span>
            ))}
            {tags.map((tag) => (
              <a class="internal" href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}>
                #{tag}
              </a>
            ))}
          </div>
        )}
        <h1 class="article-title">{title}</h1>
        {summary && !isOverview && <p class="document-masthead__summary">{summary}</p>}
        <ContentMetadata {...props} />
        {showMastheadRecord && facts.length > 0 && (
          <section class="document-masthead__record" aria-labelledby="masthead-record-title">
            <h2 id="masthead-record-title">Record details</h2>
            <dl class="document-masthead__facts">
              {facts.map((fact) => (
                <div>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        {hero && (
          <figure class="document-masthead__hero">
            <img
              src={resolveHero(fileData.slug!, hero)}
              alt={textValue(frontmatter.heroAlt) ?? ""}
              loading="eager"
            />
          </figure>
        )}
      </header>
    )
  }

  DocumentMasthead.css = style
  return DocumentMasthead
}) satisfies QuartzComponentConstructor

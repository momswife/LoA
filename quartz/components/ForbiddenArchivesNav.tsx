import { QuartzComponent, QuartzComponentConstructor } from "./types"
import { forbiddenArchivesIndex, isForbiddenArchive } from "../util/forbiddenArchives"
import { FullSlug, resolveRelative } from "../util/path"

const ForbiddenArchivesNav: QuartzComponent = ({ fileData, allFiles }) => {
  if (!isForbiddenArchive(fileData.slug)) return null
  const records = allFiles
    .filter((file) => isForbiddenArchive(file.slug) && file.slug !== forbiddenArchivesIndex)
    .sort((a, b) => (a.slug ?? "").localeCompare(b.slug ?? "", undefined, { numeric: true }))
  return (
    <nav class="forbidden-archive-nav" aria-label="Forbidden Archives">
      <p class="forbidden-archive-nav__label">Withdrawn catalogue · IV</p>
      <a
        class="forbidden-archive-nav__title"
        href={resolveRelative(fileData.slug!, forbiddenArchivesIndex)}
      >
        IV. Forbidden Archives
      </a>
      <ul>
        {records.map((record) => (
          <li>
            <a
              href={resolveRelative(fileData.slug!, record.slug!)}
              aria-current={record.slug === fileData.slug ? "page" : undefined}
            >
              {record.frontmatter?.title ?? "Restricted record"}
            </a>
          </li>
        ))}
      </ul>
      <a
        href={resolveRelative(
          fileData.slug!,
          "aerathon---eternal-labyrinths/iii.-monthly-ledger/overview" as FullSlug,
        )}
      >
        Return to the Monthly Ledger
      </a>
    </nav>
  )
}

export default (() => ForbiddenArchivesNav) satisfies QuartzComponentConstructor

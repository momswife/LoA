import { QuartzComponent, QuartzComponentConstructor } from "./types"
import { forbiddenArchivesIndex, isForbiddenArchive } from "../util/forbiddenArchives"
import { FullSlug, resolveRelative } from "../util/path"

const ForbiddenArchivesNav: QuartzComponent = ({ fileData }) => {
  if (!isForbiddenArchive(fileData.slug)) return null
  const entry = "aerathon---eternal-labyrinths/iv.-forbidden-archives/code-ooc" as FullSlug
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
        <li>
          <a href={resolveRelative(fileData.slug!, entry)}>Code OOC</a>
        </li>
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

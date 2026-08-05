import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"

const mapSlug = "aerathon---eternal-labyrinths/explore-locations" as FullSlug

const SiteNav: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  return (
    <nav class="site-nav" aria-label="Featured destination">
      <a class="site-nav__map" href={resolveRelative(fileData.slug!, mapSlug)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
          <path d="M9 3v15M15 6v15" />
        </svg>
        <span>Explore Malarthain</span>
      </a>
    </nav>
  )
}

export default (() => SiteNav) satisfies QuartzComponentConstructor

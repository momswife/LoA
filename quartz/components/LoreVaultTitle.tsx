import { joinSegments, pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

const LoreVaultTitle: QuartzComponent = ({ fileData, cfg, displayClass }) => {
  const baseDir = pathToRoot(fileData.slug!)
  return (
    <h2 class={[displayClass, "page-title"].filter(Boolean).join(" ")}>
      <a class="lore-vault-brand" href={baseDir}>
        <img
          class="lore-vault-brand__mark"
          src={joinSegments(baseDir, "static/labyrinth-heart.svg")}
          width="36"
          height="36"
          alt=""
          aria-hidden="true"
        />
        <span>{cfg.pageTitle}</span>
      </a>
    </h2>
  )
}

LoreVaultTitle.css = `
  .page-title { font-family: var(--titleFont); }
  .site-toolbar .page-title a.lore-vault-brand { display: inline-flex; align-items: center; gap: 0.65rem; }
  .lore-vault-brand__mark { display: block; flex: 0 0 auto; margin: 0; border-radius: 0; }
  :root:has(.forbidden-archive-nav) .lore-vault-brand__mark { filter: grayscale(1); }
  @media (max-width: 600px) {
    .site-toolbar .page-title a.lore-vault-brand { gap: 0.45rem; }
    .lore-vault-brand__mark { width: 28px; height: 28px; }
  }
`

export default (() => LoreVaultTitle) satisfies QuartzComponentConstructor

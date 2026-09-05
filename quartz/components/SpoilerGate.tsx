import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { isSpoilerFrontmatter, spoilerWarningFor } from "../util/spoilers"
import style from "./styles/spoilerGate.scss"

// @ts-ignore - Imported as source text by the Quartz inline-script loader.
import script from "./scripts/spoiler-gate.inline"

export default (() => {
  const SpoilerGate: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const frontmatter = fileData.frontmatter
    if (!isSpoilerFrontmatter(frontmatter)) return null

    return (
      <section class="spoiler-gate" aria-labelledby="spoiler-gate-title">
        <div class="spoiler-gate__seal" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
            <path d="M9.9 4.3A11.2 11.2 0 0 1 12 4c5.4 0 9 5.1 9 5.1a15 15 0 0 1-2.2 2.5" />
            <path d="M6.6 6.6A16.3 16.3 0 0 0 3 9.1S6.6 14.2 12 14.2c.9 0 1.8-.2 2.6-.4" />
          </svg>
        </div>
        <div class="spoiler-gate__copy">
          <p class="spoiler-gate__eyebrow">Reader advisory</p>
          <h1 id="spoiler-gate-title">Spoilers ahead</h1>
          <p>{spoilerWarningFor(frontmatter)}</p>
        </div>
        <label class="spoiler-gate__reveal">
          <input class="spoiler-gate__control" type="checkbox" />
          <span>Reveal this record</span>
        </label>
        <p class="spoiler-gate__note">
          The record will be concealed again after you leave the page.
        </p>
      </section>
    )
  }

  SpoilerGate.css = style
  SpoilerGate.afterDOMLoaded = script
  return SpoilerGate
}) satisfies QuartzComponentConstructor

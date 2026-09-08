import { QuartzComponent, QuartzComponentConstructor } from "./types"
import style from "./styles/oocDisclosure.scss"

// @ts-ignore - Imported as source text by the Quartz inline-script loader.
import script from "./scripts/ooc-disclosure.inline"

export default (() => {
  const OocDisclosure: QuartzComponent = () => null

  OocDisclosure.css = style
  OocDisclosure.afterDOMLoaded = script
  return OocDisclosure
}) satisfies QuartzComponentConstructor

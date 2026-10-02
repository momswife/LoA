import { QuartzComponent, QuartzComponentConstructor } from "./types"
import style from "./styles/oocDisclosure.scss"

// @ts-expect-error -- The Quartz loader imports this module as raw source text.
import script from "./scripts/ooc-disclosure.inline"

export default (() => {
  const OocDisclosure: QuartzComponent = () => null

  OocDisclosure.css = style
  OocDisclosure.afterDOMLoaded = script
  return OocDisclosure
}) satisfies QuartzComponentConstructor

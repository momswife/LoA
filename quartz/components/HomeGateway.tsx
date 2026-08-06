import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"

const destinations = [
  {
    numeral: "I",
    title: "Annals & Antiquities",
    description:
      "Foundational histories, vanished civilizations, relics, and disputed chronologies.",
    slug: "aerathon---eternal-labyrinths/i.-annals--and--antiquities/index" as FullSlug,
  },
  {
    numeral: "II",
    title: "The Living Atlas",
    description: "The present-day world: its peoples, powers, settlements, and institutions.",
    slug: "aerathon---eternal-labyrinths/ii.-the-living-atlas/index" as FullSlug,
  },
  {
    numeral: "III",
    title: "Monthly Ledger",
    description: "Developing events, field intelligence, notices, rumors, and active threats.",
    slug: "aerathon---eternal-labyrinths/iii.-monthly-ledger/index" as FullSlug,
  },
]

const mapSlug = "aerathon---eternal-labyrinths/explore-locations" as FullSlug

const HomeGateway: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  return (
    <section class="home-gateway" aria-labelledby="home-gateway-title">
      <div class="home-gateway__intro">
        <p class="home-gateway__eyebrow">Archive index</p>
        <h2 id="home-gateway-title">Enter the Lore Vault</h2>
        <p>
          Choose a division or follow the party&apos;s current arc through Malarthain Stronghold.
        </p>
      </div>
      <div class="home-gateway__grid">
        {destinations.map((destination) => (
          <a
            class="home-gateway__card internal"
            href={resolveRelative(fileData.slug!, destination.slug)}
          >
            <span class="home-gateway__numeral">{destination.numeral}</span>
            <span class="home-gateway__card-copy">
              <strong>{destination.title}</strong>
              <span>{destination.description}</span>
            </span>
          </a>
        ))}
        <a
          class="home-gateway__card home-gateway__card--current internal"
          href={resolveRelative(fileData.slug!, mapSlug)}
        >
          <span class="home-gateway__status">Current arc</span>
          <span class="home-gateway__card-copy">
            <strong>Explore Malarthain Stronghold Map</strong>
            <span>Open the interactive map and follow the locations shaping the adventure.</span>
          </span>
          <span class="home-gateway__arrow" aria-hidden="true">
            →
          </span>
        </a>
      </div>
    </section>
  )
}

export default (() => HomeGateway) satisfies QuartzComponentConstructor

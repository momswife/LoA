import { QuartzComponent, QuartzComponentConstructor } from "./types"
import style from "./styles/worldwireFeed.scss"

type WirePost = {
  avatar: string
  source: string
  handle: string
  age: string
  label: string
  location: string
  text: string
  tone?: "urgent" | "official" | "strange" | "light"
}

const posts: WirePost[] = [
  {
    avatar: "GN",
    source: "GSN North",
    handle: "@GSNNorth",
    age: "now",
    label: "Breaking",
    location: "Nattefrost Borderlands",
    text: "Seven northern villages have been abandoned as an unidentified illness spreads south. Healers report frost-like marks beneath the skin; officials deny that anything is moving beneath the snow.",
    tone: "urgent",
  },
  {
    avatar: "MD",
    source: "MDO Alerts",
    handle: "@MDO_Official",
    age: "4m",
    label: "Containment order",
    location: "Fortunata Hills, Vinyot",
    text: "Access to the newly documented Nameless Labyrinth is suspended. Three delving parties remain missing. Unauthorized entry will result in arrest and permanent loss of guild privileges.",
    tone: "official",
  },
  {
    avatar: "CE",
    source: "GSN Celestial Desk",
    handle: "@GSNCelestial",
    age: "11m",
    label: "Developing",
    location: "Western Aerathon",
    text: "The sun appeared to set twice. Scrying mirrors, enchanted clocks, and teleportation circles failed during the second sunset. Astronomers insist the sun did not reverse course.",
    tone: "strange",
  },
  {
    avatar: "FD",
    source: "GSN Family Desk",
    handle: "@GSNFamily",
    age: "18m",
    label: "Unconfirmed",
    location: "Louvain · Kalabil · Tempestat",
    text: "Children in three distant cities describe the same imaginary friend: a tall figure in a yellow coat named Mister Elsewhere. Parents are advised to close curtains after dark.",
    tone: "strange",
  },
  {
    avatar: "TW",
    source: "Tempestat Watch",
    handle: "@TempestatWatch",
    age: "26m",
    label: "Maritime alert",
    location: "Tempestat Sea, Al’Ar",
    text: "A guarded treasury vessel carrying silver, diplomatic gifts, and a relic from a drowned temple has vanished. Its final transmission contained bells and a woman singing underwater.",
    tone: "urgent",
  },
  {
    avatar: "OS",
    source: "Orrian Skywatch",
    handle: "@OriaWeather",
    age: "41m",
    label: "Weather advisory",
    location: "Skyforge Basin, Oria",
    text: "A thunderstorm has remained motionless for nine days, striking the same mountain point at regular intervals. Witnesses say the clouds briefly formed an open eye.",
    tone: "official",
  },
  {
    avatar: "EP",
    source: "Eastern Principalities",
    handle: "@GSNEast",
    age: "1h",
    label: "Diplomatic curiosity",
    location: "Kingdom of Pell",
    text: "King Othmar IV has formally declared war on the moon for trespassing in royal airspace and encouraging wolves. Construction of a siege ladder is reportedly underway.",
    tone: "light",
  },
  {
    avatar: "GS",
    source: "Grand Scrying Network",
    handle: "@GSNWorldwire",
    age: "2h",
    label: "Correction",
    location: "Northern Coast",
    text: "We retract yesterday’s report that Harthmere vanished. The village has been located forty miles inland. Authorities are investigating how it moved.",
    tone: "light",
  },
]

const WorldwireFeed: QuartzComponent = () => {
  return (
    <section class="worldwire" aria-labelledby="worldwire-title">
      <header class="worldwire__header">
        <div>
          <p class="worldwire__network">Grand Scrying Network</p>
          <h2 id="worldwire-title">Worldwire</h2>
          <p class="worldwire__dek">Developing stories across Aerathon</p>
        </div>
        <div class="worldwire__live" aria-label="Live transmission">
          <span aria-hidden="true"></span>
          Live
        </div>
      </header>

      <div class="worldwire__feed" aria-label="Latest Worldwire dispatches">
        {posts.map((post) => (
          <article class="worldwire-post" data-tone={post.tone}>
            <header class="worldwire-post__identity">
              <span class="worldwire-post__avatar" aria-hidden="true">
                {post.avatar}
              </span>
              <span class="worldwire-post__byline">
                <strong>{post.source}</strong>
                <span>
                  {post.handle} · {post.age}
                </span>
              </span>
              <span class="worldwire-post__signal" aria-label="Verified scrying source">
                ✦
              </span>
            </header>
            <p class="worldwire-post__text">{post.text}</p>
            <footer class="worldwire-post__meta">
              <span class="worldwire-post__label">{post.label}</span>
              <span>{post.location}</span>
            </footer>
          </article>
        ))}
      </div>

      <footer class="worldwire__footer">
        <span>Signal refresh: continuous</span>
        <span>Reports are provisional and may vanish without archival notice.</span>
      </footer>
    </section>
  )
}

WorldwireFeed.css = style

export default (() => WorldwireFeed) satisfies QuartzComponentConstructor

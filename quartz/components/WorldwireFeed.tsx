import { QuartzComponent, QuartzComponentConstructor } from "./types"
import {
  initialThreadlinePostIds,
  markerLabels,
  markerText,
  randomThreadlineTags,
  ThreadlinePost,
  threadlinePosts,
} from "./data/threadlinePosts"
import style from "./styles/worldwireFeed.scss"

// @ts-ignore
import script from "./scripts/threadline.inline"

function ThreadlineCard({ post }: { post: ThreadlinePost }) {
  return (
    <article
      class="worldwire-post"
      data-threadline-card
      data-threadline-post-id={post.id}
      data-threadline-handle-value={post.handle}
      data-threadline-marker-value={post.marker}
    >
      <header class="worldwire-post__identity">
        <span class="worldwire-post__avatar" data-threadline-avatar aria-hidden="true">
          {post.avatar}
        </span>
        <span class="worldwire-post__byline">
          <span class="worldwire-post__name-line">
            <strong data-threadline-source>{post.source}</strong>
            <span
              class="worldwire-post__marker"
              data-threadline-marker
              data-marker={post.marker}
              hidden={post.marker === "field"}
              aria-label={markerLabels[post.marker]}
            >
              {markerText[post.marker]}
            </span>
          </span>
          <span>
            <span data-threadline-handle>{post.handle}</span>
            <span aria-hidden="true"> · </span>
            <span data-threadline-age aria-label="Loading post age">
              …
            </span>
          </span>
        </span>
      </header>
      <p class="worldwire-post__text" data-threadline-text>
        {post.text}
      </p>
      <p class="worldwire-post__tags" data-threadline-tags>
        {randomThreadlineTags(post).map((tag) => (
          <span>{tag}</span>
        ))}
      </p>
    </article>
  )
}

const WorldwireFeed: QuartzComponent = () => {
  const initialPosts = initialThreadlinePostIds.flatMap((id) => {
    const post = threadlinePosts.find((candidate) => candidate.id === id)
    return post ? [post] : []
  })

  return (
    <section class="worldwire" aria-labelledby="worldwire-title">
      <header class="worldwire__header">
        <div>
          <p class="worldwire__network">Threadline</p>
          <h2 id="worldwire-title">Live Across Aerathon</h2>
          <p class="worldwire__dek">Public signals, field reports, and developing stories</p>
        </div>
        <div class="worldwire__controls">
          <div class="worldwire__live" aria-label="Live transmission">
            <span aria-hidden="true"></span>
            Live
          </div>
          <button
            class="worldwire__toggle"
            type="button"
            data-threadline-toggle
            aria-pressed="false"
            aria-label="Pause Threadline updates"
          >
            <span aria-hidden="true" data-threadline-toggle-icon>
              Ⅱ
            </span>
            <span data-threadline-toggle-label>Pause</span>
          </button>
        </div>
      </header>

      <div class="worldwire__feed" aria-label="Latest Threadline posts">
        {initialPosts.map((post) => (
          <ThreadlineCard post={post} />
        ))}
        <aside class="worldwire__notice" role="note">
          Worldwire broadcasts are fleeting and provisional. Reports may be corrected, contradicted,
          or lost before they ever enter the permanent archive.
        </aside>
      </div>
      <p
        class="worldwire__announcer"
        data-threadline-announcer
        aria-live="polite"
        aria-atomic="true"
      ></p>
    </section>
  )
}

WorldwireFeed.css = style
WorldwireFeed.afterDOMLoaded = script

export default (() => WorldwireFeed) satisfies QuartzComponentConstructor

import {
  markerLabels,
  markerText,
  randomThreadlineTags,
  ThreadlinePost,
  threadlinePosts,
} from "../data/threadlinePosts"
import { selectThreadlinePost } from "../data/threadlineSelection"

const minimumCardSwapDelay = 60_000
const maximumCardSwapDelay = 3 * 60_000
const minimumInitialAge = 20_000
const maximumInitialAge = 28 * 60_000
const accountCooldown = 35 * 60_000

const recentlySeenHandles = new Map<string, number>()
let availablePostIds = new Set(threadlinePosts.map((post) => post.id))

function setPostAge(card: HTMLElement, elapsedMilliseconds = 0) {
  card.dataset.threadlineAppearedAt = String(Date.now() - elapsedMilliseconds)

  const age = card.querySelector<HTMLElement>("[data-threadline-age]")
  if (age) {
    const label = formatPostAge(Math.floor(elapsedMilliseconds / 1000))
    age.textContent = label
    age.setAttribute("aria-label", label === "NOW" ? "Posted now" : `Posted ${label} ago`)
  }
}

function randomInitialAge() {
  return minimumInitialAge + Math.floor(Math.random() * (maximumInitialAge - minimumInitialAge))
}

function formatPostAge(elapsedSeconds: number): string {
  if (elapsedSeconds < 5) return "NOW"
  if (elapsedSeconds < 60) return `${elapsedSeconds}s`

  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  if (elapsedMinutes < 60) return `${elapsedMinutes}m`

  return `${Math.floor(elapsedMinutes / 60)}h`
}

function updatePostAges(feed: HTMLElement) {
  const now = Date.now()

  for (const card of feed.querySelectorAll<HTMLElement>("[data-threadline-card]")) {
    const appearedAt = Number(card.dataset.threadlineAppearedAt)
    if (!Number.isFinite(appearedAt)) {
      setPostAge(card)
      continue
    }

    const elapsedSeconds = Math.max(0, Math.floor((now - appearedAt) / 1000))
    const age = card.querySelector<HTMLElement>("[data-threadline-age]")
    if (age) {
      const label = formatPostAge(elapsedSeconds)
      age.textContent = label
      age.setAttribute("aria-label", label === "NOW" ? "Posted now" : `Posted ${label} ago`)
    }
  }
}

function setPostTags(container: HTMLElement, post: ThreadlinePost) {
  container.replaceChildren(
    ...randomThreadlineTags(post).map((tag) => {
      const item = document.createElement("span")
      item.textContent = tag
      return item
    }),
  )
}

function renderPost(card: HTMLElement, post: ThreadlinePost) {
  card.dataset.threadlinePostId = post.id
  card.dataset.threadlineHandleValue = post.handle
  card.dataset.threadlineMarkerValue = post.marker
  setPostAge(card)

  const avatar = card.querySelector<HTMLElement>("[data-threadline-avatar]")
  const source = card.querySelector<HTMLElement>("[data-threadline-source]")
  const handle = card.querySelector<HTMLElement>("[data-threadline-handle]")
  const marker = card.querySelector<HTMLElement>("[data-threadline-marker]")
  const text = card.querySelector<HTMLElement>("[data-threadline-text]")
  const tags = card.querySelector<HTMLElement>("[data-threadline-tags]")

  if (avatar) avatar.textContent = post.avatar
  if (source) source.textContent = post.source
  if (handle) handle.textContent = post.handle
  if (text) text.textContent = post.text
  if (marker) {
    const showMarker = post.marker !== "field"
    marker.hidden = !showMarker
    marker.textContent = showMarker ? markerText[post.marker] : ""
    marker.dataset.marker = post.marker
    if (showMarker) {
      marker.setAttribute("aria-label", markerLabels[post.marker])
    } else {
      marker.removeAttribute("aria-label")
    }
  }
  if (tags) setPostTags(tags, post)
}

function visibleThreadlineState(feed: HTMLElement) {
  const cards = [...feed.querySelectorAll<HTMLElement>("[data-threadline-card]")]
  return {
    ids: new Set(
      cards.map((card) => card.dataset.threadlinePostId).filter((id): id is string => Boolean(id)),
    ),
    handles: new Set(
      cards
        .map((card) => card.dataset.threadlineHandleValue)
        .filter((handle): handle is string => Boolean(handle)),
    ),
  }
}

function rememberPost(post: ThreadlinePost, seenAt = Date.now()) {
  recentlySeenHandles.set(post.handle, seenAt)
  availablePostIds.delete(post.id)
}

function refillPostBag(visibleIds: ReadonlySet<string>) {
  availablePostIds = new Set(
    threadlinePosts.map((post) => post.id).filter((postId) => !visibleIds.has(postId)),
  )
}

function nextPost(
  feed: HTMLElement,
  reservedPostIds: ReadonlySet<string> = new Set(),
  reservedHandles: ReadonlySet<string> = new Set(),
): ThreadlinePost | undefined {
  const visible = visibleThreadlineState(feed)
  for (const postId of reservedPostIds) visible.ids.add(postId)
  for (const handle of reservedHandles) visible.handles.add(handle)
  const now = Date.now()
  const selectionState = () => ({
    visibleIds: visible.ids,
    visibleHandles: visible.handles,
    recentlySeenHandles,
    availablePostIds,
    now,
    accountCooldown,
  })

  let post = selectThreadlinePost(threadlinePosts, selectionState())
  if (post && !availablePostIds.has(post.id)) {
    refillPostBag(visible.ids)
    post = selectThreadlinePost(threadlinePosts, selectionState())
  }

  return post
}

function setupThreadline() {
  for (const feed of document.querySelectorAll<HTMLElement>(".worldwire")) {
    if (feed.dataset.threadlineReady === "true") continue
    feed.dataset.threadlineReady = "true"

    const cards = [...feed.querySelectorAll<HTMLElement>("[data-threadline-card]")]
    if (cards.length === 0) continue

    const toggle = feed.querySelector<HTMLButtonElement>("[data-threadline-toggle]")
    const toggleIcon = feed.querySelector<HTMLElement>("[data-threadline-toggle-icon]")
    const toggleLabel = feed.querySelector<HTMLElement>("[data-threadline-toggle-label]")
    const announcer = feed.querySelector<HTMLElement>("[data-threadline-announcer]")
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let stopped = false
    let paused = false
    const swapTimers = new Map<HTMLElement, number>()
    const transitionTimers = new Map<HTMLElement, number>()
    const entryTimers = new Map<HTMLElement, number>()
    const reservedPostIds = new Set<string>()
    const reservedHandles = new Set<string>()
    let ageTimer: number | undefined

    const initialPosts = cards.flatMap((card) => {
      const post = threadlinePosts.find(
        (candidate) => candidate.id === card.dataset.threadlinePostId,
      )
      return post ? [post] : []
    })
    for (const post of initialPosts) rememberPost(post)

    // Hydrate every card from the session-wide no-repeat bag so each visit has
    // its own balanced front page rather than two permanently pinned accounts.
    for (const card of cards) {
      const post = nextPost(feed)
      if (!post) continue
      renderPost(card, post)
      rememberPost(post)
    }

    for (const card of cards) setPostAge(card, randomInitialAge())
    ageTimer = window.setInterval(() => updatePostAges(feed), 1000)

    const clearTimers = (timers: Map<HTMLElement, number>) => {
      for (const timer of timers.values()) window.clearTimeout(timer)
      timers.clear()
    }

    const scheduleSwap = (card: HTMLElement) => {
      if (stopped || paused || reducedMotion) return
      const delay =
        minimumCardSwapDelay +
        Math.floor(Math.random() * (maximumCardSwapDelay - minimumCardSwapDelay))
      const existingTimer = swapTimers.get(card)
      if (existingTimer !== undefined) window.clearTimeout(existingTimer)
      swapTimers.set(
        card,
        window.setTimeout(() => {
          swapTimers.delete(card)
          swapOne(card)
        }, delay),
      )
    }

    const swapOne = (card: HTMLElement) => {
      if (stopped || paused) return
      if (document.hidden || card.matches(":hover") || card.contains(document.activeElement)) {
        scheduleSwap(card)
        return
      }

      const post = nextPost(feed, reservedPostIds, reservedHandles)
      if (!post) {
        scheduleSwap(card)
        return
      }

      const outgoingHandle = card.dataset.threadlineHandleValue
      if (outgoingHandle) recentlySeenHandles.set(outgoingHandle, Date.now())
      reservedPostIds.add(post.id)
      reservedHandles.add(post.handle)

      card.classList.add("is-swapping-out")
      transitionTimers.set(
        card,
        window.setTimeout(() => {
          transitionTimers.delete(card)
          reservedPostIds.delete(post.id)
          reservedHandles.delete(post.handle)
          renderPost(card, post)
          rememberPost(post)
          card.classList.remove("is-swapping-out")
          card.classList.add("is-swapping-in")
          if (announcer) announcer.textContent = `New Threadline post from ${post.source}.`
          entryTimers.set(
            card,
            window.setTimeout(() => {
              entryTimers.delete(card)
              card.classList.remove("is-swapping-in")
            }, 480),
          )
          scheduleSwap(card)
        }, 260),
      )
    }

    const setPaused = (nextPaused: boolean) => {
      paused = nextPaused
      feed.dataset.threadlinePaused = String(paused)
      clearTimers(swapTimers)

      if (toggle) {
        toggle.setAttribute("aria-pressed", String(paused))
        toggle.setAttribute(
          "aria-label",
          paused ? "Resume Threadline updates" : "Pause Threadline updates",
        )
      }
      if (toggleIcon) toggleIcon.textContent = paused ? "▶" : "Ⅱ"
      if (toggleLabel) toggleLabel.textContent = paused ? "Resume" : "Pause"
      if (!paused) cards.forEach(scheduleSwap)
    }

    const toggleUpdates = () => setPaused(!paused)
    if (toggle) {
      toggle.hidden = reducedMotion
      toggle.addEventListener("click", toggleUpdates)
    }

    cards.forEach(scheduleSwap)

    window.addCleanup(() => {
      stopped = true
      clearTimers(swapTimers)
      clearTimers(transitionTimers)
      clearTimers(entryTimers)
      reservedPostIds.clear()
      reservedHandles.clear()
      if (ageTimer !== undefined) window.clearInterval(ageTimer)
      toggle?.removeEventListener("click", toggleUpdates)
    })
  }
}

document.addEventListener("nav", setupThreadline)
document.addEventListener("render", setupThreadline)

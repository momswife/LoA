import {
  markerLabels,
  markerText,
  randomThreadlineTags,
  ThreadlinePost,
  threadlinePosts,
} from "../data/threadlinePosts"

const minimumSwapDelay = 60_000
const maximumSwapDelay = 7 * 60_000
const minimumInitialAge = 20_000
const maximumInitialAge = 28 * 60_000

function randomItem<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)]
}

function setPostAge(card: HTMLElement, elapsedMilliseconds = 0) {
  card.dataset.threadlineAppearedAt = String(Date.now() - elapsedMilliseconds)

  const age = card.querySelector<HTMLElement>("[data-threadline-age]")
  if (age) {
    const label = formatPostAge(Math.floor(elapsedMilliseconds / 1000))
    age.textContent = label
    age.setAttribute("aria-label", label === "NOW" ? "Posted now" : `Posted ${label} ago`)
  }
}

function resetPostAge(card: HTMLElement) {
  setPostAge(card)
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
      resetPostAge(card)
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

function renderPost(card: HTMLElement, post: ThreadlinePost) {
  card.dataset.threadlinePostId = post.id
  resetPostAge(card)

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
  if (tags) {
    tags.replaceChildren(
      ...randomThreadlineTags(post).map((tag) => {
        const item = document.createElement("span")
        item.textContent = tag
        return item
      }),
    )
  }
}

function setupThreadline() {
  for (const feed of document.querySelectorAll<HTMLElement>(".worldwire")) {
    if (feed.dataset.threadlineReady === "true") continue
    feed.dataset.threadlineReady = "true"

    const cards = [...feed.querySelectorAll<HTMLElement>("[data-threadline-card]")]
    if (cards.length === 0) continue

    const rotatingCards = [...feed.querySelectorAll<HTMLElement>("[data-threadline-rotating]")]

    let stopped = false
    let swapTimer: number | undefined
    let transitionTimer: number | undefined
    let entryTimer: number | undefined
    let ageTimer: number | undefined
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const visibleIds = () =>
      new Set(
        [...feed.querySelectorAll<HTMLElement>("[data-threadline-card]")]
          .map((card) => card.dataset.threadlinePostId)
          .filter((id): id is string => Boolean(id)),
      )

    const nextPost = () => {
      const visible = visibleIds()
      return randomItem(threadlinePosts.filter((post) => !visible.has(post.id)))
    }

    // Give every visit a different set while retaining the two lead reports.
    for (const card of rotatingCards) {
      const post = nextPost()
      if (post) renderPost(card, post)
    }

    // Vary the hashtag selection for the two retained lead reports as well.
    for (const card of cards) {
      const post = threadlinePosts.find(
        (candidate) => candidate.id === card.dataset.threadlinePostId,
      )
      const tags = card.querySelector<HTMLElement>("[data-threadline-tags]")
      if (!post || !tags) continue
      tags.replaceChildren(
        ...randomThreadlineTags(post).map((tag) => {
          const item = document.createElement("span")
          item.textContent = tag
          return item
        }),
      )
    }

    for (const card of cards) setPostAge(card, randomInitialAge())
    ageTimer = window.setInterval(() => updatePostAges(feed), 1000)

    const scheduleSwap = () => {
      if (stopped || reducedMotion) return
      const delay =
        minimumSwapDelay + Math.floor(Math.random() * (maximumSwapDelay - minimumSwapDelay))
      swapTimer = window.setTimeout(swapOne, delay)
    }

    const swapOne = () => {
      if (stopped) return
      if (document.hidden) {
        scheduleSwap()
        return
      }

      const card = randomItem(rotatingCards)
      const post = nextPost()
      if (!card || !post) {
        scheduleSwap()
        return
      }

      card.classList.add("is-swapping-out")
      transitionTimer = window.setTimeout(() => {
        renderPost(card, post)
        card.classList.remove("is-swapping-out")
        card.classList.add("is-swapping-in")
        entryTimer = window.setTimeout(() => card.classList.remove("is-swapping-in"), 480)
        scheduleSwap()
      }, 260)
    }

    scheduleSwap()

    window.addCleanup(() => {
      stopped = true
      if (swapTimer !== undefined) window.clearTimeout(swapTimer)
      if (transitionTimer !== undefined) window.clearTimeout(transitionTimer)
      if (entryTimer !== undefined) window.clearTimeout(entryTimer)
      if (ageTimer !== undefined) window.clearInterval(ageTimer)
    })
  }
}

document.addEventListener("nav", setupThreadline)
document.addEventListener("render", setupThreadline)

import { markerLabels, markerText, ThreadlinePost, threadlinePosts } from "../data/threadlinePosts"

function randomItem<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)]
}

function renderPost(card: HTMLElement, post: ThreadlinePost) {
  card.dataset.threadlinePostId = post.id

  const avatar = card.querySelector<HTMLElement>("[data-threadline-avatar]")
  const source = card.querySelector<HTMLElement>("[data-threadline-source]")
  const handle = card.querySelector<HTMLElement>("[data-threadline-handle]")
  const age = card.querySelector<HTMLElement>("[data-threadline-age]")
  const marker = card.querySelector<HTMLElement>("[data-threadline-marker]")
  const text = card.querySelector<HTMLElement>("[data-threadline-text]")
  const tags = card.querySelector<HTMLElement>("[data-threadline-tags]")

  if (avatar) avatar.textContent = post.avatar
  if (source) source.textContent = post.source
  if (handle) handle.textContent = post.handle
  if (age) age.textContent = post.age
  if (text) text.textContent = post.text
  if (marker) {
    marker.textContent = markerText[post.marker]
    marker.dataset.marker = post.marker
    marker.setAttribute("aria-label", markerLabels[post.marker])
  }
  if (tags) {
    tags.replaceChildren(
      ...post.tags.map((tag) => {
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

    const rotatingCards = [...feed.querySelectorAll<HTMLElement>("[data-threadline-rotating]")]
    if (rotatingCards.length === 0) continue

    let stopped = false
    let swapTimer: number | undefined
    let transitionTimer: number | undefined
    let entryTimer: number | undefined
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

    const scheduleSwap = () => {
      if (stopped || reducedMotion) return
      const delay = 9000 + Math.floor(Math.random() * 9000)
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
    })
  }
}

document.addEventListener("nav", setupThreadline)
document.addEventListener("render", setupThreadline)

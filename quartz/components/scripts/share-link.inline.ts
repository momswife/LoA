document.addEventListener("nav", () => {
  for (const button of document.querySelectorAll<HTMLButtonElement>("button[data-share-url]")) {
    const container = button.closest<HTMLElement>(".share-link")!
    const status = container.querySelector<HTMLElement>(".share-link-status")!
    const fallback = container.querySelector<HTMLInputElement>("input")!
    let resetTimer: ReturnType<typeof setTimeout> | undefined
    let disposed = false
    const reset = () => {
      delete button.dataset.copied
      button.title = "Copy link"
      button.setAttribute("aria-label", "Copy short link to this article")
      status.textContent = ""
    }
    const copy = async () => {
      clearTimeout(resetTimer)
      reset()
      button.disabled = true
      try {
        await navigator.clipboard.writeText(button.dataset.shareUrl!)
        if (disposed) return
        button.dataset.copied = "true"
        button.title = "Link copied"
        button.setAttribute("aria-label", "Link copied")
        status.textContent = "Link copied"
        fallback.hidden = true
        resetTimer = setTimeout(reset, 1800)
      } catch {
        if (disposed) return
        status.textContent = "Select and copy this link:"
        fallback.hidden = false
        fallback.focus()
        fallback.select()
      } finally {
        if (!disposed) button.disabled = false
      }
    }
    button.addEventListener("click", copy)
    window.addCleanup(() => {
      disposed = true
      clearTimeout(resetTimer)
      button.removeEventListener("click", copy)
    })
  }
})

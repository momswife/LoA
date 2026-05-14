let isReaderMode = false

const emitReaderModeChangeEvent = (mode: "on" | "off") => {
  const event: CustomEventMap["readermodechange"] = new CustomEvent("readermodechange", {
    detail: { mode },
  })
  document.dispatchEvent(event)
}

document.addEventListener("nav", () => {
  const setVisibleReaderModeGutter = (target: EventTarget | null) => {
    if (!isReaderMode || !(target instanceof Element)) {
      document.documentElement.removeAttribute("reader-mode-gutter")
      return
    }

    const sidebar = target.closest(".sidebar.left, .sidebar.right")
    if (sidebar?.classList.contains("left")) {
      document.documentElement.setAttribute("reader-mode-gutter", "left")
    } else if (sidebar?.classList.contains("right")) {
      document.documentElement.setAttribute("reader-mode-gutter", "right")
    } else {
      document.documentElement.removeAttribute("reader-mode-gutter")
    }
  }

  const switchReaderMode = (event: Event) => {
    isReaderMode = !isReaderMode
    const newMode = isReaderMode ? "on" : "off"
    document.documentElement.setAttribute("reader-mode", newMode)
    document.documentElement.removeAttribute("reader-mode-gutter")
    emitReaderModeChangeEvent(newMode)

    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur()
    }
  }

  const updateReaderModeGutter = (event: PointerEvent) => setVisibleReaderModeGutter(event.target)
  const hideReaderModeGutter = () => setVisibleReaderModeGutter(null)

  for (const readerModeButton of document.getElementsByClassName("readermode")) {
    readerModeButton.addEventListener("click", switchReaderMode)
    window.addCleanup(() => readerModeButton.removeEventListener("click", switchReaderMode))
  }

  document.addEventListener("pointermove", updateReaderModeGutter)
  document.addEventListener("pointerleave", hideReaderModeGutter)
  window.addCleanup(() => document.removeEventListener("pointermove", updateReaderModeGutter))
  window.addCleanup(() => document.removeEventListener("pointerleave", hideReaderModeGutter))

  // Set initial state
  document.documentElement.setAttribute("reader-mode", isReaderMode ? "on" : "off")
})

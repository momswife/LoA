let isReaderMode = false

const emitReaderModeChangeEvent = (mode: "on" | "off") => {
  const event: CustomEventMap["readermodechange"] = new CustomEvent("readermodechange", {
    detail: { mode },
  })
  document.dispatchEvent(event)
}

document.addEventListener("nav", () => {
  const switchReaderMode = () => {
    isReaderMode = !isReaderMode
    const newMode = isReaderMode ? "on" : "off"
    const root = document.documentElement
    root.setAttribute("reader-mode", newMode)

    if (isReaderMode) {
      root.classList.add("reader-mode-just-enabled")
      const allowHoverReveal = () => root.classList.remove("reader-mode-just-enabled")
      window.setTimeout(allowHoverReveal, 500)
      document.addEventListener("pointermove", allowHoverReveal, { once: true })
    } else {
      root.classList.remove("reader-mode-just-enabled")
    }

    emitReaderModeChangeEvent(newMode)
  }

  for (const readerModeButton of document.getElementsByClassName("readermode")) {
    readerModeButton.addEventListener("click", switchReaderMode)
    window.addCleanup(() => readerModeButton.removeEventListener("click", switchReaderMode))
  }

  // Set initial state
  document.documentElement.setAttribute("reader-mode", isReaderMode ? "on" : "off")
})

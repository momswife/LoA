function setupSpoilerGates(event: Event) {
  for (const gate of document.querySelectorAll<HTMLElement>(".spoiler-gate")) {
    const control = gate.querySelector<HTMLInputElement>(".spoiler-gate__control")
    if (!control) continue
    // SPA morphing can reuse a previously checked input. Each navigation is a
    // new clearance decision, including Back/Forward and another gated page.
    if (event.type === "nav") control.checked = false
    if (gate.dataset.spoilerReady === "true") continue
    gate.dataset.spoilerReady = "true"

    const reveal = () => {
      if (!control.checked) return

      window.requestAnimationFrame(() => {
        const center = gate.closest<HTMLElement>(".center")
        const title = center?.querySelector<HTMLElement>(".article-title, article h1, article")
        if (!title) return

        const hadTabIndex = title.hasAttribute("tabindex")
        title.setAttribute("tabindex", "-1")
        title.focus({ preventScroll: true })
        if (!hadTabIndex) {
          title.addEventListener("blur", () => title.removeAttribute("tabindex"), { once: true })
        }
      })
    }

    control.addEventListener("change", reveal)
    window.addCleanup(() => {
      control.removeEventListener("change", reveal)
      delete gate.dataset.spoilerReady
    })
  }
}

document.addEventListener("nav", setupSpoilerGates)
document.addEventListener("render", setupSpoilerGates)

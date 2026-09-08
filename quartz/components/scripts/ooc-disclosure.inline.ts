function setupOocDisclosures() {
  const disclosures = document.querySelectorAll<HTMLElement>(
    '.callout[data-callout="ooc"]',
  )

  disclosures.forEach((disclosure, index) => {
    if (disclosure.dataset.oocReady === "true") return

    const title = disclosure.querySelector<HTMLElement>(":scope > .callout-title")
    const content = disclosure.querySelector<HTMLElement>(":scope > .callout-content")
    if (!title || !content) return

    disclosure.dataset.oocReady = "true"
    disclosure.classList.remove("is-collapsed", "is-collapsible")
    disclosure.classList.add("ooc-disclosure")

    const contentId = "ooc-disclosure-" + index
    content.id = contentId
    content.setAttribute("aria-hidden", "true")
    content.setAttribute("inert", "")

    title.removeAttribute("role")
    title.removeAttribute("tabindex")
    title.removeAttribute("aria-controls")
    title.removeAttribute("aria-expanded")

    const button = document.createElement("button")
    button.type = "button"
    button.className = "ooc-disclosure__reveal"
    button.setAttribute("aria-controls", contentId)
    button.setAttribute("aria-expanded", "false")

    const buttonCopy = document.createElement("span")
    buttonCopy.className = "ooc-disclosure__button-copy"

    const eyebrow = document.createElement("span")
    eyebrow.className = "ooc-disclosure__eyebrow"
    eyebrow.textContent = "MDO archival code · OOC"

    const action = document.createElement("span")
    action.className = "ooc-disclosure__action"
    action.textContent = "Review at your own discretion"

    const note = document.createElement("span")
    note.className = "ooc-disclosure__note"
    note.textContent = "Restricted table mechanics follow. Remove the archival veil to proceed."

    buttonCopy.append(eyebrow, action, note)
    button.append(buttonCopy)
    disclosure.insertBefore(button, content)

    const reveal = () => {
      disclosure.classList.add("is-revealed")
      content.removeAttribute("inert")
      content.setAttribute("aria-hidden", "false")
      button.setAttribute("aria-expanded", "true")
      button.hidden = true
    }

    button.addEventListener("click", reveal)
    window.addCleanup(() => {
      button.removeEventListener("click", reveal)
    })
  })
}

document.addEventListener("nav", setupOocDisclosures)
document.addEventListener("render", setupOocDisclosures)

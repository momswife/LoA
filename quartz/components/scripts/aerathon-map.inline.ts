type MapPin = {
  id?: string
  title: string
  type?: string
  typeLabel?: string
  status?: string
  summary?: string
  link?: string
  sourceLink?: string
  x: number
  y: number
}

type MapData = {
  pins: MapPin[]
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const markerTypes = [
  { id: "country", label: "Countries" },
  { id: "city", label: "Cities" },
  { id: "town", label: "Towns" },
  { id: "isle", label: "Isles" },
  { id: "geographic-region", label: "Geographic Regions" },
  { id: "geographic-landmark", label: "Geographic Landmarks" },
  { id: "notable-location", label: "Notable Locations" },
  { id: "labyrinth", label: "Labyrinths" },
]

const markerLabels = new Map(markerTypes.map((type) => [type.id, type.label]))
const escapeYaml = (value: string) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
let nextPinId = 0

function initAerathonMap(map: HTMLElement) {
  if (map.dataset.initialized === "true") return
  map.dataset.initialized = "true"

  const data = JSON.parse(map.dataset.map ?? "{}") as MapData
  const viewport = map.querySelector<HTMLElement>(".aerathon-map__viewport")
  const stage = map.querySelector<HTMLElement>(".aerathon-map__stage")
  const pinLayer = map.querySelector<HTMLElement>(".aerathon-map__pins")
  const popup = map.querySelector<HTMLElement>(".aerathon-map__popup")
  const popupTitle = map.querySelector<HTMLElement>(".aerathon-map__popup-title")
  const popupMeta = map.querySelector<HTMLElement>(".aerathon-map__popup-meta")
  const popupSummary = map.querySelector<HTMLElement>(".aerathon-map__popup-summary")
  const popupLink = map.querySelector<HTMLAnchorElement>(".aerathon-map__popup-link")
  const closeButton = map.querySelector<HTMLButtonElement>(".aerathon-map__popup-close")
  const zoomInButton = map.querySelector<HTMLButtonElement>('[data-map-zoom="in"]')
  const zoomOutButton = map.querySelector<HTMLButtonElement>('[data-map-zoom="out"]')
  const resetButton = map.querySelector<HTMLButtonElement>('[data-map-zoom="reset"]')
  const legend = map.querySelector<HTMLElement>(".aerathon-map__legend")
  const editor = map.querySelector<HTMLElement>(".aerathon-map__editor")
  const saveButton = map.querySelector<HTMLButtonElement>('[data-map-editor="save"]')
  const cancelButton = map.querySelector<HTMLButtonElement>('[data-map-editor="cancel"]')
  const deleteButton = map.querySelector<HTMLButtonElement>('[data-map-editor="delete"]')
  const pinsCopyButton = map.querySelector<HTMLButtonElement>(".aerathon-map__pins-copy")
  const pinsCloseButton = map.querySelector<HTMLButtonElement>(".aerathon-map__pins-close")
  const pinsToggleButton = map.querySelector<HTMLButtonElement>(".aerathon-map__pins-toggle")
  const editMode = new URLSearchParams(window.location.search).has("editPins")
  const storageKey = `aerathon-map:${window.location.pathname}:pins`
  map.classList.toggle("is-editing", editMode)

  if (!viewport || !stage || !pinLayer || !popup || !popupTitle || !popupMeta || !popupSummary) {
    return
  }

  let scale = 1
  let translateX = 0
  let translateY = 0
  let activePin: HTMLElement | null = null
  let activeEditorPin: { pin: MapPin; button: HTMLButtonElement; isNew: boolean } | null = null
  let editorDraft: MapPin | null = null
  const pointers = new Map<number, PointerEvent>()
  let dragStart: { x: number; y: number; translateX: number; translateY: number } | null = null
  let pinDrag: {
    pin: MapPin
    button: HTMLButtonElement
    pointerId: number
    moved: boolean
  } | null = null
  let suppressNextPinClick = false
  let pinchStart: {
    distance: number
    scale: number
    translateX: number
    translateY: number
  } | null = null

  const normalizePin = (pin: MapPin): MapPin => {
    const type = pin.type ?? "notable-location"
    return {
      ...pin,
      id: pin.id ?? `pin-${nextPinId++}`,
      type,
      typeLabel: markerLabels.get(type),
    }
  }

  try {
    const savedPins = localStorage.getItem(storageKey)
    if (savedPins) {
      data.pins = (JSON.parse(savedPins) as MapPin[]).map(normalizePin)
    } else {
      data.pins = (data.pins ?? []).map(normalizePin)
    }
  } catch {
    data.pins = (data.pins ?? []).map(normalizePin)
  }

  const persistPins = () => {
    localStorage.setItem(storageKey, JSON.stringify(data.pins.map(normalizePin)))
  }

  const applyTransform = () => {
    const viewportRect = viewport.getBoundingClientRect()
    const stageRect = stage.getBoundingClientRect()
    const naturalWidth = stageRect.width / scale
    const naturalHeight = stageRect.height / scale
    const minX = Math.min(0, viewportRect.width - naturalWidth * scale)
    const minY = Math.min(0, viewportRect.height - naturalHeight * scale)

    if (naturalWidth * scale <= viewportRect.width) {
      translateX = (viewportRect.width - naturalWidth * scale) / 2
    } else {
      translateX = clamp(translateX, minX, 0)
    }

    if (naturalHeight * scale <= viewportRect.height) {
      translateY = (viewportRect.height - naturalHeight * scale) / 2
    } else {
      translateY = clamp(translateY, minY, 0)
    }

    stage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`
  }

  const moveLegendToSidebar = () => {
    if (!legend) return
    const rightSidebar = document.querySelector<HTMLElement>(".right.sidebar")
    if (rightSidebar && window.matchMedia("(min-width: 1200px)").matches) {
      legend.classList.add("aerathon-map__legend--sidebar")
      rightSidebar.prepend(legend)
    }
  }

  const getField = <T extends HTMLElement>(field: string) =>
    map.querySelector<T>(`[data-map-field="${field}"]`)

  const pinToYaml = (pin: MapPin) => {
    const lines = [
      `  - title: ${escapeYaml(pin.title || "New Pin")}`,
      `    type: ${pin.type ?? "notable-location"}`,
    ]
    if (pin.status) lines.push(`    status: ${escapeYaml(pin.status)}`)
    lines.push(`    x: ${pin.x.toFixed(2)}`)
    lines.push(`    y: ${pin.y.toFixed(2)}`)
    if (pin.sourceLink || pin.link)
      lines.push(`    link: ${escapeYaml(pin.sourceLink ?? pin.link!)}`)
    if (pin.summary) lines.push(`    summary: ${escapeYaml(pin.summary)}`)
    return lines.join("\n")
  }

  const copyText = (text: string) => {
    console.info(text)
    void navigator.clipboard?.writeText(text)
  }

  const openExportPanel = () => {
    const panel = map.querySelector<HTMLElement>(".aerathon-map__pins-panel")
    if (!panel || !editMode) return
    panel.hidden = false
    panel.removeAttribute("hidden")
    panel.style.display = ""
    panel.classList.add("is-open")
  }

  const closeExportPanel = () => {
    const panel = map.querySelector<HTMLElement>(".aerathon-map__pins-panel")
    if (!panel) return
    panel.hidden = true
    panel.setAttribute("hidden", "")
    panel.style.display = "none"
    panel.classList.remove("is-open")
  }

  const getPinsYamlField = () => map.querySelector<HTMLTextAreaElement>(".aerathon-map__pins-yaml")

  const pinsToYaml = () => `pins:\n${data.pins.map(pinToYaml).join("\n")}`

  const copyPinSnippet = (pin: MapPin) => {
    const snippet = pinToYaml(pin)
    console.info(snippet)
    void navigator.clipboard?.writeText(snippet)
  }

  const updateExportPanel = (showPanel = false) => {
    const field = getPinsYamlField()
    if (!field) return
    field.value = pinsToYaml()
    if (showPanel) openExportPanel()
  }

  const syncExportPanel = () => {
    if (!editMode) return
    updateExportPanel()
  }

  const positionFromPointer = (event: PointerEvent) => {
    const rect = stage.getBoundingClientRect()
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    }
  }

  const hidePopup = () => {
    popup.hidden = true
    activePin?.setAttribute("aria-expanded", "false")
    activePin = null
  }

  const closeEditor = () => {
    if (!editor) return
    editor.hidden = true
    editor.setAttribute("hidden", "")
    editor.style.display = "none"
    delete editor.dataset.pinId
  }

  const openEditorElement = () => {
    if (!editor) return
    editor.hidden = false
    editor.removeAttribute("hidden")
    editor.style.display = ""
  }

  const syncButton = (pin: MapPin, button: HTMLButtonElement) => {
    button.style.left = `${pin.x}%`
    button.style.top = `${pin.y}%`
    button.dataset.type = pin.type ?? "notable-location"
    button.setAttribute("aria-label", pin.title || "Untitled pin")
    button.style.removeProperty("--aerathon-marker-color")
  }

  const setEditorValue = (field: string, value: string | number | undefined) => {
    const input = getField<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(field)
    if (input) input.value = value === undefined ? "" : String(value)
  }

  const findEditorTarget = () => {
    if (activeEditorPin) return activeEditorPin
    const pinId = editor?.dataset.pinId
    if (!pinId) return null
    const pin = data.pins.find((candidate) => candidate.id === pinId)
    const button = pinLayer.querySelector<HTMLButtonElement>(`[data-pin-id="${pinId}"]`)
    if (!pin || !button) return null
    activeEditorPin = { pin, button, isNew: button.classList.contains("aerathon-map__pin--draft") }
    return activeEditorPin
  }

  const openEditor = (pin: MapPin, button: HTMLButtonElement, isNew = false) => {
    if (!editMode || !editor) return
    pin.id = pin.id ?? `pin-${nextPinId++}`
    activeEditorPin = { pin, button, isNew }
    editorDraft = { ...pin }
    editor.dataset.pinId = pin.id
    setEditorValue("title", pin.title)
    setEditorValue("type", pin.type ?? "notable-location")
    setEditorValue("status", pin.status)
    setEditorValue("sourceLink", pin.sourceLink ?? pin.link)
    setEditorValue("summary", pin.summary)
    setEditorValue("x", pin.x.toFixed(2))
    setEditorValue("y", pin.y.toFixed(2))
    openEditorElement()
  }

  const readEditorDraft = () => {
    const target = findEditorTarget()
    if (!editorDraft && target) editorDraft = { ...target.pin }
    if (!editorDraft) return null
    const type = getField<HTMLSelectElement>("type")?.value || "notable-location"
    return {
      ...editorDraft,
      title: getField<HTMLInputElement>("title")?.value.trim() || "Untitled Pin",
      type,
      typeLabel: markerLabels.get(type),
      status: getField<HTMLInputElement>("status")?.value.trim() || undefined,
      sourceLink: getField<HTMLInputElement>("sourceLink")?.value.trim() || undefined,
      link: getField<HTMLInputElement>("sourceLink")?.value.trim() || undefined,
      summary: getField<HTMLTextAreaElement>("summary")?.value.trim() || undefined,
      x: clamp(Number(getField<HTMLInputElement>("x")?.value) || editorDraft.x, 0, 100),
      y: clamp(Number(getField<HTMLInputElement>("y")?.value) || editorDraft.y, 0, 100),
    }
  }

  const previewActivePinFromEditor = () => {
    const target = findEditorTarget()
    if (!target) return
    const draft = readEditorDraft()
    if (!draft) return
    syncButton(draft, target.button)
    showPopup(draft, target.button)
  }

  const saveActivePinFromEditor = () => {
    console.info("[Aerathon map] Save pin clicked")
    const target = findEditorTarget()
    try {
      if (!target) return
      const draft = readEditorDraft()
      if (!draft) return
      Object.assign(target.pin, draft, { id: target.pin.id })
      target.button.classList.remove("aerathon-map__pin--draft")
      syncButton(target.pin, target.button)
      persistPins()
      syncExportPanel()
    } finally {
      hidePopup()
      closeEditor()
      activeEditorPin = null
      editorDraft = null
    }
  }

  const cancelActivePinEdit = () => {
    const target = findEditorTarget()
    if (!target) return
    if (target.isNew) {
      data.pins = data.pins.filter((candidate) => candidate !== target.pin)
      target.button.remove()
      hidePopup()
    } else {
      syncButton(target.pin, target.button)
      showPopup(target.pin, target.button)
    }
    closeEditor()
    activeEditorPin = null
    editorDraft = null
  }

  const showPopup = (pin: MapPin, button: HTMLElement) => {
    activePin?.setAttribute("aria-expanded", "false")
    activePin = button
    button.setAttribute("aria-expanded", "true")

    popupTitle.textContent = pin.title
    const meta = [pin.typeLabel ?? pin.type, pin.status].filter(Boolean).join(" / ")
    popupMeta.textContent = meta
    popupMeta.hidden = meta.length === 0
    popupSummary.textContent = pin.summary ?? ""
    popupSummary.hidden = !pin.summary

    if (popupLink && pin.link) {
      popupLink.href = pin.link
      popupLink.hidden = false
    } else if (popupLink) {
      popupLink.hidden = true
    }

    popup.hidden = false
  }

  const zoomAt = (nextScale: number, clientX: number, clientY: number) => {
    const rect = viewport.getBoundingClientRect()
    const oldScale = scale
    nextScale = clamp(nextScale, 1, 5)
    const offsetX = clientX - rect.left
    const offsetY = clientY - rect.top
    const originX = (offsetX - translateX) / oldScale
    const originY = (offsetY - translateY) / oldScale

    scale = nextScale
    translateX = offsetX - originX * scale
    translateY = offsetY - originY * scale
    applyTransform()
  }

  const zoomFromCenter = (nextScale: number) => {
    const rect = viewport.getBoundingClientRect()
    zoomAt(nextScale, rect.left + rect.width / 2, rect.top + rect.height / 2)
  }

  const resetView = () => {
    scale = 1
    translateX = 0
    translateY = 0
    applyTransform()
  }

  const pointerDistance = () => {
    const [first, second] = [...pointers.values()]
    if (!first || !second) return 0
    return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY)
  }

  const pointerCenter = () => {
    const [first, second] = [...pointers.values()]
    if (!first || !second) return null
    return {
      x: (first.clientX + second.clientX) / 2,
      y: (first.clientY + second.clientY) / 2,
    }
  }

  const createPinButton = (pin: MapPin, temporary = false) => {
    pin.id = pin.id ?? `pin-${nextPinId++}`
    const button = document.createElement("button")
    button.className = "aerathon-map__pin"
    if (temporary) button.classList.add("aerathon-map__pin--draft")
    button.type = "button"
    button.dataset.pinId = pin.id
    syncButton(pin, button)
    button.setAttribute("aria-expanded", "false")
    button.addEventListener("click", (event) => {
      event.stopPropagation()
      if (suppressNextPinClick) {
        suppressNextPinClick = false
        return
      }
      showPopup(pin, button)
      openEditor(pin, button)
    })
    button.addEventListener("pointerdown", (event) => {
      if (!editMode) return
      event.preventDefault()
      event.stopPropagation()
      button.setPointerCapture(event.pointerId)
      pinDrag = { pin, button, pointerId: event.pointerId, moved: false }
      hidePopup()
    })
    button.addEventListener("pointermove", (event) => {
      if (!pinDrag || pinDrag.pointerId !== event.pointerId) return
      const next = positionFromPointer(event)
      pin.x = next.x
      pin.y = next.y
      syncButton(pin, button)
      pinDrag.moved = true
    })
    button.addEventListener("pointerup", (event) => {
      if (!pinDrag || pinDrag.pointerId !== event.pointerId) return
      if (pinDrag.moved) {
        suppressNextPinClick = true
        copyPinSnippet(pin)
        openEditor(pin, button)
      }
      pinDrag = null
    })
    button.addEventListener("pointercancel", () => {
      pinDrag = null
    })
    button.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hidePopup()
        button.focus()
      }
    })
    pinLayer.append(button)
    return button
  }

  const createDraftPin = (event: PointerEvent) => {
    const next = positionFromPointer(event)
    const pin: MapPin = {
      title: "New Pin",
      id: `pin-${nextPinId++}`,
      type: "notable-location",
      typeLabel: "Notable Locations",
      x: next.x,
      y: next.y,
      summary: "",
    }

    data.pins.push(pin)
    const button = createPinButton(pin, true)
    copyPinSnippet(pin)
    showPopup(pin, button)
    openEditor(pin, button, true)
  }

  pinLayer.replaceChildren()
  for (const pin of data.pins ?? []) {
    createPinButton(pin)
  }

  viewport.addEventListener("wheel", (event) => {
    event.preventDefault()
    const delta = event.deltaY > 0 ? 0.88 : 1.12
    zoomAt(scale * delta, event.clientX, event.clientY)
  })

  viewport.addEventListener("pointerdown", (event) => {
    if (
      (event.target as HTMLElement).closest(
        ".aerathon-map__pin, .aerathon-map__popup, .aerathon-map__controls, .aerathon-map__legend, .aerathon-map__editor, .aerathon-map__pins-panel",
      )
    ) {
      return
    }
    hidePopup()

    if (editMode && event.button === 1) {
      event.preventDefault()
      createDraftPin(event)
      return
    }

    viewport.setPointerCapture(event.pointerId)
    pointers.set(event.pointerId, event)

    if (pointers.size === 1) {
      dragStart = {
        x: event.clientX,
        y: event.clientY,
        translateX,
        translateY,
      }
    } else if (pointers.size === 2) {
      pinchStart = {
        distance: pointerDistance(),
        scale,
        translateX,
        translateY,
      }
    }
  })
  viewport.addEventListener("auxclick", (event) => {
    if (editMode && event.button === 1) event.preventDefault()
  })

  viewport.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return
    pointers.set(event.pointerId, event)

    if (pointers.size === 2 && pinchStart) {
      const center = pointerCenter()
      if (!center) return
      zoomAt(pinchStart.scale * (pointerDistance() / pinchStart.distance), center.x, center.y)
    } else if (dragStart && pointers.size === 1) {
      translateX = dragStart.translateX + event.clientX - dragStart.x
      translateY = dragStart.translateY + event.clientY - dragStart.y
      applyTransform()
    }
  })

  const finishPointer = (event: PointerEvent) => {
    pointers.delete(event.pointerId)
    if (pointers.size === 0) {
      dragStart = null
      pinchStart = null
    }
  }

  viewport.addEventListener("pointerup", finishPointer)
  viewport.addEventListener("pointercancel", finishPointer)
  viewport.addEventListener("click", (event) => {
    if (event.target === viewport) hidePopup()
  })
  closeButton?.addEventListener("click", hidePopup)
  zoomInButton?.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    zoomFromCenter(scale * 1.25)
  })
  zoomOutButton?.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    zoomFromCenter(scale / 1.25)
  })
  resetButton?.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    resetView()
  })
  editor?.addEventListener("input", previewActivePinFromEditor)
  editor?.addEventListener("pointerdown", (event) => event.stopPropagation())
  editor?.addEventListener("click", (event) => event.stopPropagation())
  saveButton?.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    saveActivePinFromEditor()
  })
  cancelButton?.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    cancelActivePinEdit()
  })
  deleteButton?.addEventListener("click", () => {
    console.info("[Aerathon map] Delete pin clicked")
    const target = findEditorTarget()
    if (!target) return
    const { pin, button } = target
    data.pins = data.pins.filter((candidate) => candidate !== pin)
    button.remove()
    hidePopup()
    closeEditor()
    activeEditorPin = null
    editorDraft = null
    persistPins()
    syncExportPanel()
  })
  pinsCopyButton?.addEventListener("click", () => {
    updateExportPanel()
    const field = getPinsYamlField()
    if (field) copyText(field.value)
  })
  pinsCloseButton?.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    closeExportPanel()
  })

  const handleExportToggle = (event: Event) => {
    event.preventDefault()
    event.stopPropagation()
    updateExportPanel(true)
    openExportPanel()
  }

  pinsToggleButton?.addEventListener("pointerdown", handleExportToggle)
  pinsToggleButton?.addEventListener("click", handleExportToggle)
  map.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest(".aerathon-map__pins-toggle")) {
      handleExportToggle(event)
    }
  })

  const handleDocumentKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      hidePopup()
      closeExportPanel()
    }
  }
  document.addEventListener("keydown", handleDocumentKeydown)
  window.addCleanup(() => document.removeEventListener("keydown", handleDocumentKeydown))

  const resizeObserver = new ResizeObserver(applyTransform)
  resizeObserver.observe(viewport)
  resizeObserver.observe(stage)
  window.addCleanup(() => resizeObserver.disconnect())

  moveLegendToSidebar()
  syncExportPanel()
  applyTransform()
}

document.addEventListener("nav", () => {
  document.querySelectorAll<HTMLElement>(".aerathon-map").forEach(initAerathonMap)
})

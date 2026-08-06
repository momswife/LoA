type MapPin = {
  id?: string
  number?: number
  title?: string
  type?: string
  typeLabel?: string
  status?: string
  summary?: string
  description?: string
  link?: string
  sourceLink?: string
  x?: number
  y?: number
  incomplete?: boolean
  hasQuest?: boolean
}

type MapDataset = {
  schemaVersion: number
  source: string
  map: {
    id: string
    label: string
    image: string
    expectedLocationCount: number
    suppliedLocationCount: number
    incompleteLocationNumbers: number[]
  }
  categories: Record<string, string>
}

type MapData = {
  pins: MapPin[]
  dataset?: MapDataset
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const defaultMarkerTypes = [
  { id: "country", label: "Countries" },
  { id: "city", label: "Cities" },
  { id: "town", label: "Towns" },
  { id: "isle", label: "Isles" },
  { id: "geographic-region", label: "Geographic Regions" },
  { id: "geographic-landmark", label: "Geographic Landmarks" },
  { id: "notable-location", label: "Notable Locations" },
  { id: "labyrinth", label: "Labyrinths" },
]

const yamlString = (value: string) => JSON.stringify(value)
let nextPinId = 0

function initAerathonMap(map: HTMLElement) {
  if (map.dataset.initialized === "true") return
  map.dataset.initialized = "true"

  const data = JSON.parse(map.dataset.map ?? "{}") as MapData
  const datasetMode = data.dataset !== undefined
  const viewport = map.querySelector<HTMLElement>(".aerathon-map__viewport")
  const stage = map.querySelector<HTMLElement>(".aerathon-map__stage")
  const pinLayer = map.querySelector<HTMLElement>(".aerathon-map__pins")
  const popup = map.querySelector<HTMLElement>(".aerathon-map__popup")
  const popupTitle = map.querySelector<HTMLElement>(".aerathon-map__popup-title")
  const popupMeta = map.querySelector<HTMLElement>(".aerathon-map__popup-meta")
  const popupNumber = map.querySelector<HTMLElement>(".aerathon-map__popup-number")
  const popupCategory = map.querySelector<HTMLElement>(".aerathon-map__popup-category")
  const popupStatus = map.querySelector<HTMLElement>(".aerathon-map__popup-status")
  const popupQuest = map.querySelector<HTMLElement>(".aerathon-map__popup-quest")
  const popupSummary = map.querySelector<HTMLElement>(".aerathon-map__popup-summary")
  const popupMore = map.querySelector<HTMLDetailsElement>(".aerathon-map__popup-more")
  const popupDescription = map.querySelector<HTMLElement>(".aerathon-map__popup-description")
  const popupLink = map.querySelector<HTMLAnchorElement>(".aerathon-map__popup-link")
  const closeButton = map.querySelector<HTMLButtonElement>(".aerathon-map__popup-close")
  const zoomInButton = map.querySelector<HTMLButtonElement>('[data-map-zoom="in"]')
  const zoomOutButton = map.querySelector<HTMLButtonElement>('[data-map-zoom="out"]')
  const resetButton = map.querySelector<HTMLButtonElement>('[data-map-zoom="reset"]')
  const fullscreenButton = map.querySelector<HTMLButtonElement>("[data-map-fullscreen]")
  const legend = map.querySelector<HTMLElement>(".aerathon-map__legend")
  const editor = map.querySelector<HTMLElement>(".aerathon-map__editor")
  const saveButton = map.querySelector<HTMLButtonElement>('[data-map-editor="save"]')
  const cancelButton = map.querySelector<HTMLButtonElement>('[data-map-editor="cancel"]')
  const deleteButton = map.querySelector<HTMLButtonElement>('[data-map-editor="delete"]')
  const pinsExportPanel = map.querySelector<HTMLElement>(".aerathon-map__pins-panel")
  const exportField = map.querySelector<HTMLTextAreaElement>(".aerathon-map__pins-yaml")
  const exportCopyButton = map.querySelector<HTMLButtonElement>(".aerathon-map__pins-copy")
  const exportToggleButton = map.querySelector<HTMLButtonElement>(".aerathon-map__pins-toggle")
  const locationsPanel = map.querySelector<HTMLElement>(".aerathon-map__locations-panel")
  const locationsList = map.querySelector<HTMLOListElement>(".aerathon-map__locations-list")
  const locationsSearch = map.querySelector<HTMLInputElement>(".aerathon-map__locations-search")
  const locationsProgress = map.querySelector<HTMLElement>(".aerathon-map__locations-progress")
  const locationsHint = map.querySelector<HTMLElement>(".aerathon-map__locations-hint")
  const locationsToggleButton = map.querySelector<HTMLButtonElement>(
    ".aerathon-map__locations-toggle",
  )
  const locationsCloseButton = map.querySelector<HTMLButtonElement>(
    ".aerathon-map__locations-close",
  )
  const locationFilterButtons = map.querySelectorAll<HTMLButtonElement>(
    "[data-map-location-filter]",
  )
  const editMode = new URLSearchParams(window.location.search).has("editPins")
  const mapId = map.dataset.mapId ?? "default"
  const storageKey = `aerathon-map:${window.location.pathname}:${mapId}:pins`

  map.classList.toggle("is-editing", editMode)
  map.classList.toggle("has-location-dataset", datasetMode)
  locationsPanel?.classList.toggle("is-editing", editMode)

  if (!viewport || !stage || !pinLayer || !popup || !popupTitle || !popupMeta || !popupSummary) {
    return
  }

  const markerLabels = new Map(defaultMarkerTypes.map((type) => [type.id, type.label]))
  for (const [id, label] of Object.entries(data.dataset?.categories ?? {})) {
    markerLabels.set(id, label)
  }

  let scale = 1
  let translateX = 0
  let translateY = 0
  let activePin: HTMLElement | null = null
  let activeEditorPin: { pin: MapPin; button: HTMLButtonElement; isNew: boolean } | null = null
  let editorDraft: MapPin | null = null
  let pendingPlacement: MapPin | null = null
  let selectedLocationId: string | null = null
  let locationFilter: "all" | "placed" | "unplaced" = "all"
  const pointers = new Map<number, PointerEvent>()
  let dragStart: { x: number; y: number; translateX: number; translateY: number } | null = null
  let pinDrag: {
    pin: MapPin
    button: HTMLButtonElement
    pointerId: number
    moved: boolean
  } | null = null
  let suppressNextPinClick = false
  let fallbackFullscreen = false
  let fullscreenRequestPending = false
  let fullscreenActive = false
  let fullscreenReflowTimer: number | undefined
  let cameraAnimationFrame: number | undefined
  let interactionAnimationFrame: number | undefined
  let locationScrollAnimationFrame: number | undefined
  let pinchStart: {
    distance: number
    scale: number
    translateX: number
    translateY: number
  } | null = null

  const hasPosition = (pin: MapPin): pin is MapPin & { x: number; y: number } =>
    typeof pin.x === "number" &&
    Number.isFinite(pin.x) &&
    typeof pin.y === "number" &&
    Number.isFinite(pin.y)

  const displayTitle = (pin: MapPin) =>
    pin.title || (pin.number !== undefined ? `Location ${pin.number}` : "Untitled pin")

  const normalizePin = (pin: MapPin): MapPin => {
    const type = pin.type ?? (datasetMode ? "unassigned" : "notable-location")
    const hasQuest =
      pin.hasQuest === true ||
      pin.summary?.includes("(!)") === true ||
      pin.description?.includes("(!)") === true
    const withoutQuestFlag = (value: string | undefined) =>
      value?.replace(/\s*\(!\)/g, "").trim() || undefined
    const normalized = {
      ...pin,
      id: pin.id ?? `pin-${nextPinId++}`,
      type,
      typeLabel: markerLabels.get(type) ?? type,
      summary: withoutQuestFlag(pin.summary),
      description: withoutQuestFlag(pin.description),
      hasQuest,
    }
    if (!hasPosition(normalized)) {
      delete normalized.x
      delete normalized.y
    }
    return normalized
  }

  const sourcePins = (data.pins ?? []).map(normalizePin)
  try {
    const savedPins = localStorage.getItem(storageKey)
    if (savedPins) {
      const saved = (JSON.parse(savedPins) as MapPin[]).map(normalizePin)
      if (datasetMode) {
        const savedById = new Map(saved.map((pin) => [pin.id, pin]))
        data.pins = sourcePins.map((sourcePin) => {
          const draft = savedById.get(sourcePin.id)
          return normalizePin(
            draft
              ? {
                  ...sourcePin,
                  ...draft,
                  id: sourcePin.id,
                  number: sourcePin.number,
                }
              : sourcePin,
          )
        })
      } else {
        data.pins = saved
      }
    } else {
      data.pins = sourcePins
    }
  } catch {
    data.pins = sourcePins
  }

  const applyTransform = () => {
    const viewportWidth = viewport.clientWidth
    const viewportHeight = viewport.clientHeight
    let naturalWidth = stage.offsetWidth
    let naturalHeight = stage.offsetHeight
    if (naturalWidth === 0 || naturalHeight === 0) {
      const stageRect = stage.getBoundingClientRect()
      naturalWidth = stageRect.width / scale
      naturalHeight = stageRect.height / scale
    }
    const minX = Math.min(0, viewportWidth - naturalWidth * scale)
    const minY = Math.min(0, viewportHeight - naturalHeight * scale)

    translateX =
      naturalWidth * scale <= viewportWidth
        ? (viewportWidth - naturalWidth * scale) / 2
        : clamp(translateX, minX, 0)
    translateY =
      naturalHeight * scale <= viewportHeight
        ? (viewportHeight - naturalHeight * scale) / 2
        : clamp(translateY, minY, 0)

    stage.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`
  }

  const scheduleTransform = () => {
    if (interactionAnimationFrame !== undefined) return
    interactionAnimationFrame = requestAnimationFrame(() => {
      interactionAnimationFrame = undefined
      applyTransform()
    })
  }

  const cancelCameraAnimation = () => {
    if (cameraAnimationFrame === undefined) return
    cancelAnimationFrame(cameraAnimationFrame)
    cameraAnimationFrame = undefined
  }

  const cameraPositionForPin = (pin: MapPin, targetScale: number) => {
    const viewportWidth = viewport.clientWidth
    const viewportHeight = viewport.clientHeight
    let naturalWidth = stage.offsetWidth
    let naturalHeight = stage.offsetHeight
    if (naturalWidth === 0 || naturalHeight === 0) {
      const stageRect = stage.getBoundingClientRect()
      naturalWidth = stageRect.width / scale
      naturalHeight = stageRect.height / scale
    }
    return {
      x: viewportWidth / 2 - naturalWidth * targetScale * (pin.x! / 100),
      y: viewportHeight / 2 - naturalHeight * targetScale * (pin.y! / 100),
    }
  }

  const focusPin = (pin: MapPin, animate = true) => {
    if (!hasPosition(pin)) return
    cancelCameraAnimation()

    const targetScale = scale < 1.65 ? 1.75 : Math.min(scale, 2)
    const target = cameraPositionForPin(pin, targetScale)
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!animate || reduceMotion) {
      scale = targetScale
      translateX = target.x
      translateY = target.y
      applyTransform()
      return
    }

    const startScale = scale
    const startX = translateX
    const startY = translateY
    const startedAt = performance.now()
    const duration = 920
    const step = (now: number) => {
      const progress = clamp((now - startedAt) / duration, 0, 1)
      const eased =
        progress < 0.5 ? 4 * Math.pow(progress, 3) : 1 - Math.pow(-2 * progress + 2, 3) / 2
      scale = startScale + (targetScale - startScale) * eased
      translateX = startX + (target.x - startX) * eased
      translateY = startY + (target.y - startY) * eased
      applyTransform()

      if (progress < 1) {
        cameraAnimationFrame = requestAnimationFrame(step)
      } else {
        cameraAnimationFrame = undefined
      }
    }
    cameraAnimationFrame = requestAnimationFrame(step)
  }

  const movePanelsToSidebar = () => {
    const rightSidebar = document.querySelector<HTMLElement>(".right.sidebar")
    const desktop = window.matchMedia("(min-width: 1200px)").matches
    const fullscreen = document.fullscreenElement === map || fallbackFullscreen

    if (datasetMode && locationsPanel && fullscreen) {
      locationsPanel.classList.remove("aerathon-map__locations-panel--sidebar")
      locationsPanel.classList.add("aerathon-map__locations-panel--fullscreen")
      map.append(locationsPanel)
      locationsPanel.hidden = false
      locationsPanel.removeAttribute("hidden")
      locationsPanel.style.display = ""
      locationsPanel.classList.add("is-open")
      return
    }

    if (datasetMode && locationsPanel && rightSidebar && desktop) {
      locationsPanel.classList.remove("aerathon-map__locations-panel--fullscreen")
      locationsPanel.classList.add("aerathon-map__locations-panel--sidebar")
      rightSidebar.prepend(locationsPanel)
      locationsPanel.hidden = false
      locationsPanel.removeAttribute("hidden")
      locationsPanel.style.display = ""
      locationsPanel.classList.add("is-open")
      if (legend instanceof HTMLDetailsElement) legend.open = false
      return
    }

    if (locationsPanel) {
      locationsPanel.classList.remove(
        "aerathon-map__locations-panel--sidebar",
        "aerathon-map__locations-panel--fullscreen",
      )
      viewport.append(locationsPanel)
      if (!editMode) {
        locationsPanel.hidden = true
        locationsPanel.setAttribute("hidden", "")
        locationsPanel.style.display = "none"
        locationsPanel.classList.remove("is-open")
      }
    }
  }

  const getField = <T extends HTMLElement>(field: string) =>
    map.querySelector<T>(`[data-map-field="${field}"]`)

  const pinToYaml = (pin: MapPin) => {
    const lines = [
      `  - title: ${yamlString(displayTitle(pin))}`,
      `    type: ${pin.type ?? "notable-location"}`,
    ]
    if (pin.status) lines.push(`    status: ${yamlString(pin.status)}`)
    if (hasPosition(pin)) {
      lines.push(`    x: ${pin.x.toFixed(2)}`)
      lines.push(`    y: ${pin.y.toFixed(2)}`)
    }
    if (pin.sourceLink || pin.link)
      lines.push(`    link: ${yamlString(pin.sourceLink ?? pin.link!)}`)
    if (pin.summary) lines.push(`    summary: ${yamlString(pin.summary)}`)
    if (pin.hasQuest) lines.push("    quest: true")
    return lines.join("\n")
  }

  const datasetToYaml = () => {
    const dataset = data.dataset!
    const ordered = [...data.pins].sort(
      (a, b) => (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER),
    )
    const incomplete = ordered.filter((pin) => pin.incomplete || !pin.title || !pin.summary)
    const incompleteNumbers = incomplete
      .map((pin) => pin.number)
      .filter((number): number is number => number !== undefined)
    const lines = [
      `schemaVersion: ${dataset.schemaVersion}`,
      "",
      "map:",
      `  id: ${yamlString(dataset.map.id)}`,
      `  label: ${yamlString(dataset.map.label)}`,
      `  image: ${yamlString(dataset.map.image)}`,
      `  expectedLocationCount: ${dataset.map.expectedLocationCount}`,
      `  suppliedLocationCount: ${ordered.length - incomplete.length}`,
    ]

    if (incompleteNumbers.length === 0) {
      lines.push("  incompleteLocationNumbers: []")
    } else {
      lines.push("  incompleteLocationNumbers:")
      for (const number of incompleteNumbers) lines.push(`    - ${number}`)
    }

    lines.push("", "categories:")
    for (const [id, label] of Object.entries(dataset.categories)) {
      lines.push(`  ${id}: ${yamlString(label)}`)
    }

    lines.push("", "locations:")
    for (const pin of ordered) {
      const isIncomplete = pin.incomplete || !pin.title || !pin.summary
      lines.push(`  - id: ${yamlString(pin.id ?? `location-${pin.number ?? "unknown"}`)}`)
      if (pin.number !== undefined) lines.push(`    number: ${pin.number}`)
      lines.push(`    title: ${pin.title ? yamlString(pin.title) : "null"}`)
      lines.push(`    category: ${yamlString(pin.type ?? "unassigned")}`)
      lines.push(`    summary: ${pin.summary ? yamlString(pin.summary) : "null"}`)
      if (pin.description) lines.push(`    description: ${yamlString(pin.description)}`)
      if (pin.hasQuest) lines.push("    quest: true")
      if (pin.status) lines.push(`    status: ${yamlString(pin.status)}`)
      if (pin.sourceLink || pin.link) {
        lines.push(`    link: ${yamlString(pin.sourceLink ?? pin.link!)}`)
      }
      if (hasPosition(pin)) {
        lines.push("    position:")
        lines.push(`      x: ${pin.x.toFixed(2)}`)
        lines.push(`      y: ${pin.y.toFixed(2)}`)
      } else {
        lines.push("    position: null")
      }
      if (isIncomplete) lines.push("    incomplete: true")
      lines.push("")
    }

    return lines.join("\n").trimEnd() + "\n"
  }

  const exportedYaml = () =>
    datasetMode
      ? datasetToYaml()
      : `pins:\n${data.pins.filter(hasPosition).map(pinToYaml).join("\n")}\n`

  const persistPins = () => {
    localStorage.setItem(storageKey, JSON.stringify(data.pins.map(normalizePin)))
  }

  const copyText = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }
    if (!exportField) return
    exportField.focus()
    exportField.select()
    document.execCommand("copy")
  }

  const openExportPanel = () => {
    if (!pinsExportPanel || !editMode) return
    if (pinsExportPanel instanceof HTMLDetailsElement) pinsExportPanel.open = true
    pinsExportPanel.classList.add("is-open")
  }

  const closeExportPanel = () => {
    if (!pinsExportPanel) return
    if (pinsExportPanel instanceof HTMLDetailsElement) pinsExportPanel.open = false
    pinsExportPanel.classList.remove("is-open")
  }

  const updateExportPanel = (showPanel = false) => {
    if (!exportField) return
    exportField.value = exportedYaml()
    if (showPanel) openExportPanel()
  }

  const syncExportPanel = () => {
    if (editMode) updateExportPanel()
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
    if (!hasPosition(pin)) {
      button.hidden = true
      return
    }
    button.hidden = false
    button.style.left = `${pin.x}%`
    button.style.top = `${pin.y}%`
    button.dataset.type = pin.type ?? "notable-location"
    button.classList.toggle("aerathon-map__pin--quest", pin.hasQuest === true)
    button.textContent = pin.number === undefined ? "" : String(pin.number)
    const numberLabel = pin.number === undefined ? "" : `Location ${pin.number}: `
    const questLabel = pin.hasQuest ? ", possible quest" : ""
    button.setAttribute("aria-label", `${numberLabel}${displayTitle(pin)}${questLabel}`)
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
    setEditorValue("number", pin.number)
    setEditorValue("title", pin.title)
    setEditorValue("type", pin.type ?? (datasetMode ? "unassigned" : "notable-location"))
    setEditorValue("status", pin.status)
    setEditorValue("sourceLink", pin.sourceLink ?? pin.link)
    setEditorValue("summary", pin.summary)
    setEditorValue("description", pin.description)
    const questField = getField<HTMLInputElement>("quest")
    if (questField) questField.checked = pin.hasQuest === true
    setEditorValue("x", hasPosition(pin) ? pin.x.toFixed(2) : undefined)
    setEditorValue("y", hasPosition(pin) ? pin.y.toFixed(2) : undefined)
    openEditorElement()
  }

  const readCoordinate = (field: string, fallback: number | undefined) => {
    const raw = getField<HTMLInputElement>(field)?.value.trim()
    if (!raw) return fallback
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? clamp(parsed, 0, 100) : fallback
  }

  const readEditorDraft = () => {
    const target = findEditorTarget()
    if (!editorDraft && target) editorDraft = { ...target.pin }
    if (!editorDraft) return null
    const type =
      getField<HTMLSelectElement>("type")?.value ||
      (datasetMode ? "unassigned" : "notable-location")
    const title = getField<HTMLInputElement>("title")?.value.trim() || undefined
    const summary = getField<HTMLTextAreaElement>("summary")?.value.trim() || undefined
    const description = getField<HTMLTextAreaElement>("description")?.value.trim() || undefined
    return {
      ...editorDraft,
      title: datasetMode ? title : title || "Untitled Pin",
      type,
      typeLabel: markerLabels.get(type) ?? type,
      status: getField<HTMLInputElement>("status")?.value.trim() || undefined,
      sourceLink: getField<HTMLInputElement>("sourceLink")?.value.trim() || undefined,
      link: getField<HTMLInputElement>("sourceLink")?.value.trim() || undefined,
      summary,
      description,
      hasQuest: getField<HTMLInputElement>("quest")?.checked === true,
      x: readCoordinate("x", editorDraft.x),
      y: readCoordinate("y", editorDraft.y),
      incomplete: datasetMode ? !title || !summary : undefined,
    }
  }

  const showPopup = (pin: MapPin, button: HTMLElement) => {
    activePin?.setAttribute("aria-expanded", "false")
    activePin = button
    button.setAttribute("aria-expanded", "true")

    popupTitle.textContent = displayTitle(pin)
    const setMetaValue = (element: HTMLElement | null, value: string | undefined) => {
      if (!element) return
      element.textContent = value ?? ""
      element.hidden = !value
    }
    setMetaValue(popupNumber, pin.number === undefined ? undefined : `#${pin.number}`)
    setMetaValue(popupCategory, pin.typeLabel ?? pin.type)
    setMetaValue(popupStatus, pin.status)
    popupMeta.hidden = ![popupNumber, popupCategory, popupStatus].some(
      (element) => element && !element.hidden,
    )
    if (popupQuest) popupQuest.hidden = pin.hasQuest !== true
    popupSummary.textContent = pin.summary ?? ""
    popupSummary.hidden = !pin.summary
    if (popupDescription && popupMore) {
      popupDescription.textContent = pin.description ?? ""
      popupMore.hidden = !pin.description
      popupMore.open = false
    }

    if (popupLink && pin.link) {
      popupLink.href = pin.link
      popupLink.hidden = false
    } else if (popupLink) {
      popupLink.hidden = true
    }

    popup.hidden = false
  }

  function renderLocationList() {
    if (!datasetMode || !locationsList) return
    const previousScrollTop = locationsList.scrollTop
    const query = locationsSearch?.value.trim().toLocaleLowerCase() ?? ""
    const ordered = [...data.pins].sort(
      (a, b) => (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER),
    )
    const placedCount = ordered.filter(hasPosition).length
    const questCount = ordered.filter((pin) => pin.hasQuest && hasPosition(pin)).length
    if (locationsProgress) {
      locationsProgress.textContent = editMode
        ? `${placedCount}/${ordered.length} placed`
        : `${placedCount} mapped · ${questCount} possible quests`
    }
    if (locationsHint) {
      locationsHint.textContent = pendingPlacement
        ? `Click the map to place #${pendingPlacement.number ?? "?"} ${displayTitle(pendingPlacement)}.`
        : "Select an unplaced location, then click the map to position it. Drag placed pins to move them."
    }

    locationsList.replaceChildren()
    let renderedCount = 0
    for (const pin of ordered) {
      const placed = hasPosition(pin)
      if (!editMode && !placed) continue
      if (locationFilter === "placed" && !placed) continue
      if (locationFilter === "unplaced" && placed) continue
      const searchable =
        `${pin.number ?? ""} ${displayTitle(pin)} ${pin.typeLabel ?? pin.type ?? ""}`.toLocaleLowerCase()
      if (query && !searchable.includes(query)) continue

      const item = document.createElement("li")
      item.className = "aerathon-map__location-item"
      const button = document.createElement("button")
      const number = document.createElement("span")
      const text = document.createElement("span")
      const title = document.createElement("span")
      const category = document.createElement("span")
      const state = document.createElement("span")
      button.type = "button"
      button.className = "aerathon-map__location-button"
      button.dataset.locationId = pin.id
      button.dataset.placement = placed ? "placed" : "unplaced"
      button.dataset.type = pin.type ?? "unassigned"
      button.classList.toggle("is-selected", selectedLocationId === pin.id)
      number.className = "aerathon-map__location-number"
      number.textContent = pin.number === undefined ? "—" : String(pin.number)
      title.className = "aerathon-map__location-title"
      title.textContent = displayTitle(pin)
      category.className = "aerathon-map__location-category"
      category.textContent = pin.typeLabel ?? pin.type ?? "Location"
      text.className = "aerathon-map__location-text"
      text.append(title, category)
      state.className = "aerathon-map__location-state"
      state.textContent = pin.hasQuest
        ? "! Quest"
        : editMode
          ? pin.incomplete
            ? "Needs details"
            : placed
              ? "Placed"
              : "Unplaced"
          : ""
      state.hidden = state.textContent.length === 0
      button.classList.toggle("has-quest", pin.hasQuest === true)
      button.append(number, text, state)
      button.addEventListener("click", () => selectLocation(pin))
      item.append(button)
      locationsList.append(item)
      renderedCount++
    }

    if (renderedCount === 0) {
      const empty = document.createElement("li")
      empty.className = "aerathon-map__locations-empty"
      empty.textContent = "No locations match this filter."
      locationsList.append(empty)
    }

    locationsList.scrollTop = Math.min(
      previousScrollTop,
      Math.max(0, locationsList.scrollHeight - locationsList.clientHeight),
    )
  }

  const syncSelectedLocation = (scrollIntoView = false) => {
    if (!locationsList) return
    const buttons = [
      ...locationsList.querySelectorAll<HTMLButtonElement>(".aerathon-map__location-button"),
    ]
    const selectedButton = buttons.find(
      (candidate) => candidate.dataset.locationId === selectedLocationId,
    )
    for (const button of buttons) button.classList.toggle("is-selected", button === selectedButton)
    if (!scrollIntoView || !selectedButton) return

    if (locationScrollAnimationFrame !== undefined) {
      cancelAnimationFrame(locationScrollAnimationFrame)
    }
    locationScrollAnimationFrame = requestAnimationFrame(() => {
      locationScrollAnimationFrame = undefined
      const listRect = locationsList.getBoundingClientRect()
      const selectedRect = selectedButton.getBoundingClientRect()
      const selectedCenter =
        locationsList.scrollTop + selectedRect.top - listRect.top + selectedRect.height / 2
      const targetScroll = clamp(
        selectedCenter - locationsList.clientHeight / 2,
        0,
        Math.max(0, locationsList.scrollHeight - locationsList.clientHeight),
      )
      locationsList.scrollTo({
        top: targetScroll,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      })
    })
  }

  const selectLocation = (pin: MapPin) => {
    selectedLocationId = pin.id ?? null
    if (!hasPosition(pin)) {
      pendingPlacement = pin
      hidePopup()
      closeEditor()
      activeEditorPin = null
      editorDraft = null
      map.classList.add("is-placing-location")
    } else {
      pendingPlacement = null
      map.classList.remove("is-placing-location")
      const button = pinLayer.querySelector<HTMLButtonElement>(`[data-pin-id="${pin.id}"]`)
      if (button) {
        focusPin(pin)
        showPopup(pin, button)
        openEditor(pin, button)
        button.focus({ preventScroll: true })
      }
    }
    syncSelectedLocation(true)
  }

  const openLocationsPanel = () => {
    if (!locationsPanel || !datasetMode) return
    locationsPanel.hidden = false
    locationsPanel.removeAttribute("hidden")
    locationsPanel.style.display = ""
    locationsPanel.classList.add("is-open")
    renderLocationList()
  }

  const closeLocationsPanel = () => {
    if (!locationsPanel) return
    locationsPanel.hidden = true
    locationsPanel.setAttribute("hidden", "")
    locationsPanel.style.display = "none"
    locationsPanel.classList.remove("is-open")
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
    const target = findEditorTarget()
    try {
      if (!target) return
      const draft = readEditorDraft()
      if (!draft) return
      Object.assign(target.pin, draft, { id: target.pin.id, number: target.pin.number })
      target.button.classList.remove("aerathon-map__pin--draft")
      syncButton(target.pin, target.button)
      persistPins()
      renderLocationList()
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
      if (datasetMode) {
        delete target.pin.x
        delete target.pin.y
        selectedLocationId = null
      } else {
        data.pins = data.pins.filter((candidate) => candidate !== target.pin)
      }
      target.button.remove()
      hidePopup()
      persistPins()
    } else if (editorDraft) {
      Object.assign(target.pin, editorDraft)
      syncButton(target.pin, target.button)
      showPopup(target.pin, target.button)
    }
    closeEditor()
    activeEditorPin = null
    editorDraft = null
    renderLocationList()
    syncExportPanel()
  }

  const zoomAt = (nextScale: number, clientX: number, clientY: number) => {
    cancelCameraAnimation()
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
    cancelCameraAnimation()
    scale = 1
    translateX = 0
    translateY = 0
    applyTransform()
  }

  const syncFullscreenState = () => {
    const nativeFullscreen = document.fullscreenElement === map
    const active = nativeFullscreen || fallbackFullscreen
    const stateChanged = active !== fullscreenActive
    fullscreenActive = active
    if (stateChanged) cancelCameraAnimation()
    map.classList.toggle("is-fullscreen", active)
    map.classList.toggle("is-fallback-fullscreen", fallbackFullscreen)
    document.documentElement.classList.toggle("map-fullscreen-open", fallbackFullscreen)
    if (fullscreenButton) {
      fullscreenButton.textContent = active ? "Collapse" : "Expand"
      fullscreenButton.setAttribute(
        "aria-label",
        active ? "Exit fullscreen map" : "Expand map to fullscreen",
      )
    }
    movePanelsToSidebar()
    if (fullscreenReflowTimer !== undefined) window.clearTimeout(fullscreenReflowTimer)
    fullscreenReflowTimer = window.setTimeout(() => {
      fullscreenReflowTimer = undefined
      if (cameraAnimationFrame !== undefined) return
      const selected = data.pins.find((pin) => pin.id === selectedLocationId)
      if (selected && active) focusPin(selected, false)
      else applyTransform()
    }, 120)
  }

  const toggleFullscreen = async () => {
    if (fullscreenRequestPending) return
    if (document.fullscreenElement === map) {
      await document.exitFullscreen()
      if (map.classList.contains("is-fullscreen")) syncFullscreenState()
      return
    }
    if (fallbackFullscreen) {
      fallbackFullscreen = false
      syncFullscreenState()
      return
    }

    fullscreenRequestPending = true
    try {
      if (map.requestFullscreen) {
        await map.requestFullscreen()
        if (!map.classList.contains("is-fullscreen")) syncFullscreenState()
      } else {
        fallbackFullscreen = true
        syncFullscreenState()
      }
    } catch {
      fallbackFullscreen = true
      syncFullscreenState()
    } finally {
      fullscreenRequestPending = false
    }
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
      selectedLocationId = pin.id ?? null
      focusPin(pin)
      showPopup(pin, button)
      openEditor(pin, button)
      syncSelectedLocation(true)
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
        if (activeEditorPin?.pin === pin) {
          setEditorValue("x", pin.x?.toFixed(2))
          setEditorValue("y", pin.y?.toFixed(2))
          if (editorDraft) editorDraft = { ...editorDraft, x: pin.x, y: pin.y }
        }
        persistPins()
        renderLocationList()
        syncExportPanel()
        showPopup(pin, button)
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
    showPopup(pin, button)
    openEditor(pin, button, true)
  }

  const placePendingLocation = (event: PointerEvent) => {
    if (!pendingPlacement) return
    const pin = pendingPlacement
    const next = positionFromPointer(event)
    pin.x = next.x
    pin.y = next.y
    pendingPlacement = null
    map.classList.remove("is-placing-location")
    const button = createPinButton(pin, true)
    showPopup(pin, button)
    openEditor(pin, button, true)
    renderLocationList()
  }

  const renderAllPins = () => {
    pinLayer.replaceChildren()
    for (const pin of data.pins) {
      if (hasPosition(pin)) createPinButton(pin)
    }
  }

  renderAllPins()

  viewport.addEventListener("wheel", (event) => {
    event.preventDefault()
    cancelCameraAnimation()
    const delta = event.deltaY > 0 ? 0.88 : 1.12
    zoomAt(scale * delta, event.clientX, event.clientY)
  })

  viewport.addEventListener("pointerdown", (event) => {
    if (
      (event.target as HTMLElement).closest(
        ".aerathon-map__pin, .aerathon-map__popup, .aerathon-map__controls, .aerathon-map__legend, .aerathon-map__editor, .aerathon-map__pins-panel, .aerathon-map__locations-panel",
      )
    ) {
      return
    }
    cancelCameraAnimation()
    hidePopup()

    if (editMode && datasetMode && pendingPlacement && event.button === 0) {
      event.preventDefault()
      event.stopPropagation()
      placePendingLocation(event)
      return
    }

    if (editMode && !datasetMode && event.button === 1) {
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
    if (editMode && !datasetMode && event.button === 1) event.preventDefault()
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
      scheduleTransform()
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
  fullscreenButton?.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    void toggleFullscreen()
  })
  editor?.addEventListener("input", previewActivePinFromEditor)
  editor?.addEventListener("pointerdown", (event) => event.stopPropagation())
  editor?.addEventListener("click", (event) => event.stopPropagation())
  saveButton?.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    saveActivePinFromEditor()
    updateExportPanel(true)
  })
  cancelButton?.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    cancelActivePinEdit()
  })
  deleteButton?.addEventListener("click", () => {
    const target = findEditorTarget()
    if (!target) return
    const { pin, button } = target
    if (datasetMode) {
      delete pin.x
      delete pin.y
      selectedLocationId = null
    } else {
      data.pins = data.pins.filter((candidate) => candidate !== pin)
    }
    button.remove()
    hidePopup()
    closeEditor()
    activeEditorPin = null
    editorDraft = null
    persistPins()
    renderLocationList()
    syncExportPanel()
  })
  exportCopyButton?.addEventListener("click", () => {
    updateExportPanel()
    if (!exportField) return
    void copyText(exportField.value)
      .then(() => {
        if (!exportCopyButton) return
        exportCopyButton.textContent = "Copied"
        window.setTimeout(() => {
          exportCopyButton.textContent = "Copy"
        }, 1500)
      })
      .catch(() => {
        exportField.focus()
        exportField.select()
        if (exportCopyButton) exportCopyButton.textContent = "Press Ctrl+C"
      })
  })
  exportToggleButton?.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    updateExportPanel(true)
  })
  pinsExportPanel?.addEventListener("toggle", () => {
    if (pinsExportPanel instanceof HTMLDetailsElement && pinsExportPanel.open) updateExportPanel()
  })
  locationsToggleButton?.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    openLocationsPanel()
  })
  locationsCloseButton?.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    closeLocationsPanel()
  })
  locationsSearch?.addEventListener("input", renderLocationList)
  for (const button of locationFilterButtons) {
    button.addEventListener("click", () => {
      const filter = button.dataset.mapLocationFilter
      if (filter === "all" || filter === "placed" || filter === "unplaced") {
        locationFilter = filter
      }
      for (const filterButton of locationFilterButtons) {
        filterButton.setAttribute(
          "aria-pressed",
          filterButton.dataset.mapLocationFilter === locationFilter ? "true" : "false",
        )
      }
      renderLocationList()
    })
  }

  const handleDocumentKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      hidePopup()
      closeExportPanel()
      if (fallbackFullscreen) {
        fallbackFullscreen = false
        syncFullscreenState()
      }
      if (pendingPlacement) {
        pendingPlacement = null
        selectedLocationId = null
        map.classList.remove("is-placing-location")
        renderLocationList()
      }
    }
  }
  document.addEventListener("keydown", handleDocumentKeydown)
  window.addCleanup(() => document.removeEventListener("keydown", handleDocumentKeydown))

  const handleFullscreenChange = () => syncFullscreenState()
  document.addEventListener("fullscreenchange", handleFullscreenChange)
  window.addCleanup(() => document.removeEventListener("fullscreenchange", handleFullscreenChange))

  const handleWindowResize = () => {
    movePanelsToSidebar()
    scheduleTransform()
  }
  window.addEventListener("resize", handleWindowResize)
  window.addCleanup(() => window.removeEventListener("resize", handleWindowResize))

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== storageKey || !event.newValue) return

    try {
      const incoming = (JSON.parse(event.newValue) as MapPin[]).map(normalizePin)
      if (datasetMode) {
        const incomingById = new Map(incoming.map((pin) => [pin.id, pin]))
        data.pins = data.pins.map((current) => {
          const synced = incomingById.get(current.id)
          return synced
            ? normalizePin({
                ...current,
                ...synced,
                id: current.id,
                number: current.number,
              })
            : current
        })
      } else {
        data.pins = incoming
      }

      pendingPlacement = null
      selectedLocationId = null
      activeEditorPin = null
      editorDraft = null
      map.classList.remove("is-placing-location")
      hidePopup()
      closeEditor()
      renderAllPins()
      renderLocationList()
      syncExportPanel()
    } catch {
      console.warn("Another tab sent invalid pin data; this tab was not changed.")
    }
  }
  window.addEventListener("storage", handleStorage)
  window.addCleanup(() => window.removeEventListener("storage", handleStorage))

  const resizeObserver = new ResizeObserver(scheduleTransform)
  resizeObserver.observe(viewport)
  resizeObserver.observe(stage)
  window.addCleanup(() => resizeObserver.disconnect())
  window.addCleanup(() => {
    if (fullscreenReflowTimer !== undefined) window.clearTimeout(fullscreenReflowTimer)
    if (interactionAnimationFrame !== undefined) cancelAnimationFrame(interactionAnimationFrame)
    if (locationScrollAnimationFrame !== undefined)
      cancelAnimationFrame(locationScrollAnimationFrame)
    cancelCameraAnimation()
    document.documentElement.classList.remove("map-fullscreen-open")
    if (document.fullscreenElement === map) void document.exitFullscreen()
  })

  movePanelsToSidebar()
  if (editMode && datasetMode) openLocationsPanel()
  for (const filterButton of locationFilterButtons) {
    filterButton.setAttribute(
      "aria-pressed",
      filterButton.dataset.mapLocationFilter === locationFilter ? "true" : "false",
    )
  }
  renderLocationList()
  syncExportPanel()
  applyTransform()
}

document.addEventListener("nav", () => {
  document.querySelectorAll<HTMLElement>(".aerathon-map").forEach(initAerathonMap)
})

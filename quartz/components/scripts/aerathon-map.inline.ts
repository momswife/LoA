type MapPin = {
  id?: string
  number?: number
  title?: string
  type?: string
  typeLabel?: string
  status?: string
  summary?: string
  link?: string
  sourceLink?: string
  x?: number
  y?: number
  incomplete?: boolean
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

type WritableYamlFile = {
  write(data: string | Blob): Promise<void>
  close(): Promise<void>
}

type WritableYamlFileHandle = {
  name: string
  createWritable(): Promise<WritableYamlFile>
}

type FilePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string
    types: Array<{
      description: string
      accept: Record<string, string[]>
    }>
  }) => Promise<WritableYamlFileHandle>
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
  const exportPanel = map.querySelector<HTMLElement>(".aerathon-map__pins-panel")
  const exportField = map.querySelector<HTMLTextAreaElement>(".aerathon-map__pins-yaml")
  const exportCopyButton = map.querySelector<HTMLButtonElement>(".aerathon-map__pins-copy")
  const exportFileButton = map.querySelector<HTMLButtonElement>(".aerathon-map__pins-file")
  const exportStatus = map.querySelector<HTMLElement>(".aerathon-map__pins-status")
  const exportCloseButton = map.querySelector<HTMLButtonElement>(".aerathon-map__pins-close")
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
  let yamlFileHandle: WritableYamlFileHandle | null = null
  let yamlWriteChain: Promise<void> = Promise.resolve()
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

  const hasPosition = (pin: MapPin): pin is MapPin & { x: number; y: number } =>
    typeof pin.x === "number" &&
    Number.isFinite(pin.x) &&
    typeof pin.y === "number" &&
    Number.isFinite(pin.y)

  const displayTitle = (pin: MapPin) =>
    pin.title || (pin.number !== undefined ? `Location ${pin.number}` : "Untitled pin")

  const normalizePin = (pin: MapPin): MapPin => {
    const type = pin.type ?? (datasetMode ? "unassigned" : "notable-location")
    const normalized = {
      ...pin,
      id: pin.id ?? `pin-${nextPinId++}`,
      type,
      typeLabel: markerLabels.get(type) ?? type,
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
    const viewportRect = viewport.getBoundingClientRect()
    const stageRect = stage.getBoundingClientRect()
    const naturalWidth = stageRect.width / scale
    const naturalHeight = stageRect.height / scale
    const minX = Math.min(0, viewportRect.width - naturalWidth * scale)
    const minY = Math.min(0, viewportRect.height - naturalHeight * scale)

    translateX =
      naturalWidth * scale <= viewportRect.width
        ? (viewportRect.width - naturalWidth * scale) / 2
        : clamp(translateX, minX, 0)
    translateY =
      naturalHeight * scale <= viewportRect.height
        ? (viewportRect.height - naturalHeight * scale) / 2
        : clamp(translateY, minY, 0)

    stage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`
  }

  const movePanelsToSidebar = () => {
    const rightSidebar = document.querySelector<HTMLElement>(".right.sidebar")
    if (!rightSidebar || !window.matchMedia("(min-width: 1200px)").matches) return

    if (editMode && datasetMode && locationsPanel) {
      locationsPanel.classList.add("aerathon-map__locations-panel--sidebar")
      rightSidebar.prepend(locationsPanel)
      if (legend instanceof HTMLDetailsElement) legend.open = false
    } else if (legend) {
      legend.classList.add("aerathon-map__legend--sidebar")
      rightSidebar.prepend(legend)
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

  const yamlFileName =
    data.dataset?.source.split(/[\\/]/).at(-1) ?? `${mapId.replace(/[^a-z0-9-]/gi, "-")}.yaml`

  const setExportStatus = (message: string, state: "draft" | "saved" | "error" = "draft") => {
    if (!exportStatus) return
    exportStatus.textContent = message
    exportStatus.dataset.state = state
  }

  const writeConnectedYaml = async () => {
    if (!yamlFileHandle || !datasetMode) return
    const writable = await yamlFileHandle.createWritable()
    await writable.write(exportedYaml())
    await writable.close()
    setExportStatus(
      `Saved to ${yamlFileHandle.name}. Future pin changes will save automatically.`,
      "saved",
    )
  }

  const queueYamlWrite = () => {
    if (!yamlFileHandle || !datasetMode) return
    yamlWriteChain = yamlWriteChain.then(writeConnectedYaml).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Could not update the YAML file."
      setExportStatus(message, "error")
    })
  }

  const persistPins = () => {
    localStorage.setItem(storageKey, JSON.stringify(data.pins.map(normalizePin)))
    queueYamlWrite()
  }

  const downloadYaml = () => {
    const url = URL.createObjectURL(new Blob([exportedYaml()], { type: "application/yaml" }))
    const link = document.createElement("a")
    link.href = url
    link.download = yamlFileName
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    setExportStatus(
      `Downloaded ${yamlFileName}. Replace the repository copy with this file.`,
      "saved",
    )
  }

  const connectYamlFile = async () => {
    const pickerWindow = window as FilePickerWindow
    if (!pickerWindow.showSaveFilePicker) {
      downloadYaml()
      return
    }

    try {
      yamlFileHandle = await pickerWindow.showSaveFilePicker({
        suggestedName: yamlFileName,
        types: [
          {
            description: "YAML location data",
            accept: {
              "application/yaml": [".yaml", ".yml"],
              "text/yaml": [".yaml", ".yml"],
            },
          },
        ],
      })
      await writeConnectedYaml()
      if (exportFileButton) exportFileButton.textContent = "YAML connected"
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      const message = error instanceof Error ? error.message : "Could not connect the YAML file."
      setExportStatus(message, "error")
    }
  }

  const copyText = (text: string) => {
    console.info(text)
    void navigator.clipboard?.writeText(text).catch(() => undefined)
  }

  const openExportPanel = () => {
    if (!exportPanel || !editMode) return
    exportPanel.hidden = false
    exportPanel.removeAttribute("hidden")
    exportPanel.style.display = ""
    exportPanel.classList.add("is-open")
  }

  const closeExportPanel = () => {
    if (!exportPanel) return
    exportPanel.hidden = true
    exportPanel.setAttribute("hidden", "")
    exportPanel.style.display = "none"
    exportPanel.classList.remove("is-open")
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
    button.textContent = pin.number === undefined ? "" : String(pin.number)
    const numberLabel = pin.number === undefined ? "" : `Location ${pin.number}: `
    button.setAttribute("aria-label", `${numberLabel}${displayTitle(pin)}`)
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
    return {
      ...editorDraft,
      title: datasetMode ? title : title || "Untitled Pin",
      type,
      typeLabel: markerLabels.get(type) ?? type,
      status: getField<HTMLInputElement>("status")?.value.trim() || undefined,
      sourceLink: getField<HTMLInputElement>("sourceLink")?.value.trim() || undefined,
      link: getField<HTMLInputElement>("sourceLink")?.value.trim() || undefined,
      summary,
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
    const number = pin.number === undefined ? undefined : `#${pin.number}`
    const meta = [number, pin.typeLabel ?? pin.type, pin.status].filter(Boolean).join(" / ")
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

  const renderLocationList = () => {
    if (!datasetMode || !locationsList) return
    const query = locationsSearch?.value.trim().toLocaleLowerCase() ?? ""
    const ordered = [...data.pins].sort(
      (a, b) => (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER),
    )
    const placedCount = ordered.filter(hasPosition).length
    if (locationsProgress) locationsProgress.textContent = `${placedCount}/${ordered.length} placed`
    if (locationsHint) {
      locationsHint.textContent = pendingPlacement
        ? `Click the map to place #${pendingPlacement.number ?? "?"} ${displayTitle(pendingPlacement)}.`
        : "Select an unplaced location, then click the map to position it. Drag placed pins to move them."
    }

    locationsList.replaceChildren()
    for (const pin of ordered) {
      const placed = hasPosition(pin)
      if (locationFilter === "placed" && !placed) continue
      if (locationFilter === "unplaced" && placed) continue
      const searchable =
        `${pin.number ?? ""} ${displayTitle(pin)} ${pin.typeLabel ?? pin.type ?? ""}`.toLocaleLowerCase()
      if (query && !searchable.includes(query)) continue

      const item = document.createElement("li")
      const button = document.createElement("button")
      const number = document.createElement("span")
      const title = document.createElement("span")
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
      state.className = "aerathon-map__location-state"
      state.textContent = pin.incomplete ? "Needs details" : placed ? "Placed" : "Unplaced"
      button.append(number, title, state)
      button.addEventListener("click", () => selectLocation(pin))
      item.append(button)
      locationsList.append(item)
    }
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
        showPopup(pin, button)
        openEditor(pin, button)
        button.focus()
      }
    }
    renderLocationList()
  }

  const openLocationsPanel = () => {
    if (!locationsPanel || !editMode || !datasetMode) return
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
      selectedLocationId = pin.id ?? null
      showPopup(pin, button)
      openEditor(pin, button)
      renderLocationList()
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
    if (exportField) copyText(exportField.value)
  })
  exportFileButton?.addEventListener("click", () => {
    updateExportPanel()
    void connectYamlFile()
  })
  exportCloseButton?.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    closeExportPanel()
  })
  exportToggleButton?.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    updateExportPanel(true)
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
      queueYamlWrite()
    } catch {
      setExportStatus("Another tab sent invalid pin data; this tab was not changed.", "error")
    }
  }
  window.addEventListener("storage", handleStorage)
  window.addCleanup(() => window.removeEventListener("storage", handleStorage))

  const resizeObserver = new ResizeObserver(applyTransform)
  resizeObserver.observe(viewport)
  resizeObserver.observe(stage)
  window.addCleanup(() => resizeObserver.disconnect())

  movePanelsToSidebar()
  if (editMode && datasetMode) openLocationsPanel()
  if (datasetMode && !(window as FilePickerWindow).showSaveFilePicker) {
    if (exportFileButton) exportFileButton.textContent = "Download YAML"
    setExportStatus(
      "This browser cannot update a local file directly. Download the YAML after editing and replace the repository copy.",
    )
  }
  renderLocationList()
  syncExportPanel()
  applyTransform()
}

document.addEventListener("nav", () => {
  document.querySelectorAll<HTMLElement>(".aerathon-map").forEach(initAerathonMap)
})

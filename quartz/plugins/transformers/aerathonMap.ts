import fs from "fs"
import path from "path"
import { Root, Code, Html } from "mdast"
import YAML from "yaml"
import { SKIP, visit } from "unist-util-visit"
import { QuartzTransformerPlugin } from "../types"
import {
  FilePath,
  FullSlug,
  RelativeURL,
  resolveRelative,
  slugifyFilePath,
  transformLink,
} from "../../util/path"
import { JSResource, CSSResource } from "../../util/resources"
// @ts-ignore
import script from "../../components/scripts/aerathon-map.inline"
import style from "../../components/styles/aerathon-map.scss"

type RawMapPin = {
  id?: unknown
  number?: unknown
  title?: unknown
  type?: unknown
  category?: unknown
  status?: unknown
  summary?: unknown
  description?: unknown
  link?: unknown
  x?: unknown
  y?: unknown
  position?: unknown
  incomplete?: unknown
}

type RawMapConfig = {
  label?: unknown
  image?: unknown
  height?: unknown
  locations?: unknown
  pins?: unknown
}

type RawLocationDataset = {
  schemaVersion?: unknown
  map?: unknown
  categories?: unknown
  locations?: unknown
}

type MapPin = {
  id?: string
  number?: number
  title?: string
  type?: string
  typeLabel?: string
  status?: string
  summary?: string
  description?: string
  link?: RelativeURL
  sourceLink?: string
  x?: number
  y?: number
  incomplete?: boolean
}

type MapDatasetMeta = {
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const isString = (value: unknown): value is string => typeof value === "string" && value.length > 0
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const markerTypes = [
  { id: "country", label: "Countries" },
  { id: "city", label: "Cities" },
  { id: "town", label: "Towns" },
  { id: "isle", label: "Isles" },
  { id: "geographic-region", label: "Geographic Regions" },
  { id: "geographic-landmark", label: "Geographic Landmarks" },
  { id: "notable-location", label: "Notable Locations" },
  { id: "labyrinth", label: "Labyrinths" },
] as const

const markerTypeAliases = new Map<string, (typeof markerTypes)[number]>([
  ["country", markerTypes[0]],
  ["countries", markerTypes[0]],
  ["city", markerTypes[1]],
  ["cities", markerTypes[1]],
  ["town", markerTypes[2]],
  ["towns", markerTypes[2]],
  ["isle", markerTypes[3]],
  ["isles", markerTypes[3]],
  ["island", markerTypes[3]],
  ["islands", markerTypes[3]],
  ["geographic region", markerTypes[4]],
  ["geographic-region", markerTypes[4]],
  ["region", markerTypes[4]],
  ["regions", markerTypes[4]],
  ["geographic landmark", markerTypes[5]],
  ["geographic-landmark", markerTypes[5]],
  ["landmark", markerTypes[5]],
  ["landmarks", markerTypes[5]],
  ["notable location", markerTypes[6]],
  ["notable-location", markerTypes[6]],
  ["location", markerTypes[6]],
  ["locations", markerTypes[6]],
  ["labyrinth", markerTypes[7]],
  ["labyrinths", markerTypes[7]],
])

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;")
}

function toNumber(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeMarkerType(value: unknown) {
  if (!isString(value)) return markerTypeAliases.get("location")!
  return markerTypeAliases.get(value.trim().toLowerCase()) ?? markerTypeAliases.get("location")!
}

function normalizeCategories(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return Object.fromEntries(markerTypes.map((type) => [type.id, type.label]))
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => isString(entry[1])),
  )
}

function normalizeLink(
  value: unknown,
  currentSlug: FullSlug,
  allSlugs: FullSlug[],
): Pick<MapPin, "link" | "sourceLink"> {
  if (!isString(value)) return {}
  return {
    link: transformLink(currentSlug, value, { strategy: "shortest", allSlugs }),
    sourceLink: value,
  }
}

function normalizeInlinePin(
  pin: RawMapPin,
  currentSlug: FullSlug,
  allSlugs: FullSlug[],
): MapPin | null {
  const x = toNumber(pin.x)
  const y = toNumber(pin.y)
  if (!isString(pin.title) || x === undefined || y === undefined) return null
  const markerType = normalizeMarkerType(pin.type)

  return {
    id: isString(pin.id) ? pin.id : undefined,
    number: toNumber(pin.number),
    title: pin.title,
    type: markerType.id,
    typeLabel: markerType.label,
    status: isString(pin.status) ? pin.status : undefined,
    summary: isString(pin.summary) ? pin.summary : undefined,
    ...normalizeLink(pin.link, currentSlug, allSlugs),
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
  }
}

function normalizeDatasetLocation(
  location: RawMapPin,
  categories: Record<string, string>,
  currentSlug: FullSlug,
  allSlugs: FullSlug[],
): MapPin | null {
  const number = toNumber(location.number)
  const id = isString(location.id)
    ? location.id
    : number !== undefined
      ? `location-${String(number).padStart(3, "0")}`
      : undefined
  if (!id) return null

  const category = isString(location.category) ? location.category : "unassigned"
  const position = isRecord(location.position) ? location.position : undefined
  const x = toNumber(position?.x)
  const y = toNumber(position?.y)
  const hasPosition = x !== undefined && y !== undefined

  return {
    id,
    number,
    title: isString(location.title) ? location.title : undefined,
    type: category,
    typeLabel: categories[category] ?? category,
    status: isString(location.status) ? location.status : undefined,
    summary: isString(location.summary) ? location.summary : undefined,
    description: isString(location.description) ? location.description : undefined,
    ...normalizeLink(location.link, currentSlug, allSlugs),
    x: hasPosition ? clamp(x, 0, 100) : undefined,
    y: hasPosition ? clamp(y, 0, 100) : undefined,
    incomplete:
      location.incomplete === true || !isString(location.title) || !isString(location.summary),
  }
}

function readLocationDataset(source: string, contentDirectory: string): RawLocationDataset {
  const contentRoot = path.resolve(contentDirectory)
  const absolutePath = path.resolve(contentRoot, source)
  const relativePath = path.relative(contentRoot, absolutePath)
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("locations file must be inside the content directory")
  }

  const parsed = YAML.parse(fs.readFileSync(absolutePath, "utf8"))
  if (!isRecord(parsed)) throw new Error("locations file must contain a YAML object")
  return parsed as RawLocationDataset
}

function renderMap(
  config: RawMapConfig,
  currentSlug: FullSlug,
  allSlugs: FullSlug[],
  contentDirectory: string,
) {
  let rawDataset: RawLocationDataset | undefined
  const locationsSource = isString(config.locations) ? config.locations : undefined
  if (locationsSource) {
    try {
      rawDataset = readLocationDataset(locationsSource, contentDirectory)
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown locations error"
      return `<p><strong>Map error:</strong> ${escapeHtml(message)}.</p>`
    }
  }

  const rawDatasetMap = isRecord(rawDataset?.map) ? rawDataset.map : {}
  const image = isString(config.image)
    ? config.image
    : isString(rawDatasetMap.image)
      ? rawDatasetMap.image
      : undefined
  if (!image) return `<p><strong>Map error:</strong> missing image.</p>`

  const imageSlug = slugifyFilePath(image as FilePath)
  const imageUrl = resolveRelative(currentSlug, imageSlug)
  const label = isString(config.label)
    ? config.label
    : isString(rawDatasetMap.label)
      ? rawDatasetMap.label
      : "Map"
  const categories = normalizeCategories(rawDataset?.categories)

  const pins = rawDataset
    ? Array.isArray(rawDataset.locations)
      ? rawDataset.locations
          .map((location) =>
            normalizeDatasetLocation(location as RawMapPin, categories, currentSlug, allSlugs),
          )
          .filter((pin): pin is MapPin => pin !== null)
      : []
    : Array.isArray(config.pins)
      ? config.pins
          .map((pin) => normalizeInlinePin(pin as RawMapPin, currentSlug, allSlugs))
          .filter((pin): pin is MapPin => pin !== null)
      : []

  const dataset: MapDatasetMeta | undefined = rawDataset
    ? {
        schemaVersion: toNumber(rawDataset.schemaVersion) ?? 1,
        source: locationsSource!,
        map: {
          id: isString(rawDatasetMap.id) ? rawDatasetMap.id : imageSlug,
          label,
          image,
          expectedLocationCount: toNumber(rawDatasetMap.expectedLocationCount) ?? pins.length,
          suppliedLocationCount:
            toNumber(rawDatasetMap.suppliedLocationCount) ??
            pins.filter((pin) => !pin.incomplete).length,
          incompleteLocationNumbers: Array.isArray(rawDatasetMap.incompleteLocationNumbers)
            ? rawDatasetMap.incompleteLocationNumbers
                .map(toNumber)
                .filter((number): number is number => number !== undefined)
            : pins
                .filter((pin) => pin.incomplete && pin.number !== undefined)
                .map((pin) => pin.number!),
        },
        categories,
      }
    : undefined

  const height = isString(config.height) ? config.height : "min(78vh, 760px)"
  const mapData = escapeAttribute(JSON.stringify({ pins, dataset }))
  const mapId = dataset?.map.id ?? imageSlug
  const legend = Object.entries(categories)
    .map(
      ([id, categoryLabel]) =>
        `<li><span class="aerathon-map__legend-dot" data-type="${escapeAttribute(id)}"></span>${escapeHtml(categoryLabel)}</li>`,
    )
    .join("")
  const categoryOptions = Object.entries(categories)
    .map(
      ([id, categoryLabel]) =>
        `<option value="${escapeAttribute(id)}">${escapeHtml(categoryLabel)}</option>`,
    )
    .join("")
  const exportLabel = dataset ? "Save locations" : "Export pins"

  return `<div class="aerathon-map" style="--aerathon-map-height: ${escapeAttribute(
    height,
  )}" data-map='${mapData}' data-map-id="${escapeAttribute(mapId)}">
  <div class="aerathon-map__viewport" aria-label="Interactive map of ${escapeAttribute(label)}">
    <div class="aerathon-map__controls" aria-label="Map controls">
      <button class="aerathon-map__control" type="button" data-map-zoom="in" aria-label="Zoom in">+</button>
      <button class="aerathon-map__control" type="button" data-map-zoom="out" aria-label="Zoom out">-</button>
      <button class="aerathon-map__control" type="button" data-map-zoom="reset" aria-label="Reset map view">Reset</button>
      <button class="aerathon-map__control aerathon-map__locations-toggle" type="button" data-map-locations="toggle">Locations</button>
      <button class="aerathon-map__control aerathon-map__pins-toggle" type="button" data-map-export="toggle">${exportLabel}</button>
    </div>
    <details class="aerathon-map__legend">
      <summary>Map Key</summary>
      <ul>${legend}</ul>
    </details>
    <div class="aerathon-map__stage">
      <img class="aerathon-map__image" src="${escapeAttribute(
        imageUrl,
      )}" alt="Map of ${escapeAttribute(label)}" draggable="false" />
      <div class="aerathon-map__pins"></div>
    </div>
    <section class="aerathon-map__locations-panel" hidden aria-label="Map locations">
      <button class="aerathon-map__locations-close" type="button" data-map-locations="close" aria-label="Close locations">&times;</button>
      <div class="aerathon-map__locations-header">
        <h3>Locations</h3>
        <div class="aerathon-map__locations-meta">
          <span class="aerathon-map__locations-progress"></span>
          <span class="aerathon-map__locations-save-state" data-state="draft">Browser draft only</span>
        </div>
      </div>
      <input class="aerathon-map__locations-search" type="search" placeholder="Search locations" aria-label="Search locations" />
      <div class="aerathon-map__locations-filters" aria-label="Filter locations">
        <button type="button" data-map-location-filter="all" aria-pressed="true">All</button>
        <button type="button" data-map-location-filter="unplaced" aria-pressed="false">Unplaced</button>
        <button type="button" data-map-location-filter="placed" aria-pressed="false">Placed</button>
      </div>
      <p class="aerathon-map__locations-hint">Select an unplaced location, then click the map to position it.</p>
      <ol class="aerathon-map__locations-list"></ol>
    </section>
    <section class="aerathon-map__popup" hidden aria-live="polite">
      <button class="aerathon-map__popup-close" type="button" aria-label="Close map pin details">&times;</button>
      <h3 class="aerathon-map__popup-title"></h3>
      <p class="aerathon-map__popup-meta"></p>
      <p class="aerathon-map__popup-summary"></p>
      <a class="aerathon-map__popup-link" href="#" target="_blank" rel="noopener noreferrer" hidden>Open record</a>
    </section>
    <section class="aerathon-map__editor" hidden aria-label="Map location editor">
      <button class="aerathon-map__editor-close" type="button" data-map-editor="cancel" aria-label="Cancel editing location">&times;</button>
      <h3>Location Editor</h3>
      <label>Number <input data-map-field="number" inputmode="numeric" readonly /></label>
      <label>Title <input data-map-field="title" /></label>
      <label>Category
        <select data-map-field="type">${categoryOptions}</select>
      </label>
      <label>Status <input data-map-field="status" /></label>
      <label>Link <input data-map-field="sourceLink" /></label>
      <label>Summary <textarea data-map-field="summary"></textarea></label>
      <label>Description <textarea data-map-field="description"></textarea></label>
      <div class="aerathon-map__editor-grid">
        <label>X <input data-map-field="x" inputmode="decimal" /></label>
        <label>Y <input data-map-field="y" inputmode="decimal" /></label>
      </div>
      <div class="aerathon-map__editor-actions">
        <button type="button" data-map-editor="save">Save</button>
        <button type="button" data-map-editor="delete">${dataset ? "Unplace" : "Delete"}</button>
      </div>
    </section>
    <section class="aerathon-map__pins-panel" hidden aria-label="Export map data">
      <button class="aerathon-map__pins-close" type="button" data-map-export="close" aria-label="Close exported map data">&times;</button>
      <div class="aerathon-map__pins-panel-header">
        <h3>${exportLabel}</h3>
        <div class="aerathon-map__pins-panel-actions">
          ${dataset ? '<button class="aerathon-map__pins-file" type="button" data-map-export="file">Connect YAML</button>' : ""}
          <button class="aerathon-map__pins-copy" type="button" data-map-export="copy">Copy</button>
        </div>
      </div>
      ${dataset ? '<p class="aerathon-map__pins-status" data-state="draft">Pin changes are browser drafts. Connect the repository YAML file to save them automatically.</p>' : ""}
      <textarea class="aerathon-map__pins-yaml" data-map-export="yaml" readonly></textarea>
    </section>
  </div>
</div>`
}

export const AerathonMap: QuartzTransformerPlugin = () => {
  return {
    name: "AerathonMap",
    markdownPlugins(ctx) {
      return [
        () => {
          return (tree: Root, file) => {
            visit(tree, "code", (node: Code, index, parent) => {
              if (node.lang !== "aerathon-map" || !parent || index === undefined) return

              let config: RawMapConfig
              try {
                config = (YAML.parse(node.value) ?? {}) as RawMapConfig
              } catch {
                config = { image: undefined }
              }

              const htmlNode: Html = {
                type: "html",
                value: renderMap(
                  config,
                  file.data.slug!,
                  ctx.allSlugs ?? [],
                  String(ctx.argv.directory),
                ),
              }

              parent.children.splice(index, 1, htmlNode)
              return SKIP
            })
          }
        },
      ]
    },
    externalResources() {
      const js: JSResource[] = [
        {
          script,
          loadTime: "afterDOMReady",
          contentType: "inline",
        },
      ]
      const css: CSSResource[] = [
        {
          content: style,
          inline: true,
        },
      ]

      return { js, css }
    },
  }
}

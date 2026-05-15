import { Root, Code, Html } from "mdast"
import yaml from "js-yaml"
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
  title?: unknown
  type?: unknown
  status?: unknown
  summary?: unknown
  link?: unknown
  x?: unknown
  y?: unknown
}

type RawMapConfig = {
  image?: unknown
  height?: unknown
  pins?: unknown
}

type MapPin = {
  title: string
  type?: string
  typeLabel?: string
  status?: string
  summary?: string
  link?: RelativeURL
  sourceLink?: string
  x: number
  y: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const isString = (value: unknown): value is string => typeof value === "string" && value.length > 0
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

function normalizePin(pin: RawMapPin, currentSlug: FullSlug, allSlugs: FullSlug[]): MapPin | null {
  const x = toNumber(pin.x)
  const y = toNumber(pin.y)
  if (!isString(pin.title) || x === undefined || y === undefined) return null
  const markerType = normalizeMarkerType(pin.type)

  return {
    title: pin.title,
    type: markerType.id,
    typeLabel: markerType.label,
    status: isString(pin.status) ? pin.status : undefined,
    summary: isString(pin.summary) ? pin.summary : undefined,
    link: isString(pin.link)
      ? transformLink(currentSlug, pin.link, { strategy: "shortest", allSlugs })
      : undefined,
    sourceLink: isString(pin.link) ? pin.link : undefined,
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
  }
}

function renderMap(config: RawMapConfig, currentSlug: FullSlug, allSlugs: FullSlug[]) {
  const image = isString(config.image) ? config.image : undefined
  if (!image) return `<p><strong>Aerathon map error:</strong> missing image.</p>`

  const imageSlug = slugifyFilePath(image as FilePath)
  const imageUrl = resolveRelative(currentSlug, imageSlug)
  const pins = Array.isArray(config.pins)
    ? config.pins
        .map((pin) => normalizePin(pin as RawMapPin, currentSlug, allSlugs))
        .filter((pin): pin is MapPin => pin !== null)
    : []

  const height = isString(config.height) ? config.height : "min(78vh, 760px)"
  const mapData = escapeAttribute(JSON.stringify({ pins }))
  const legend = markerTypes
    .map(
      (type) =>
        `<li><span class="aerathon-map__legend-dot" data-type="${type.id}"></span>${type.label}</li>`,
    )
    .join("")

  return `<div class="aerathon-map" style="--aerathon-map-height: ${escapeAttribute(
    height,
  )}" data-map='${mapData}'>
  <div class="aerathon-map__viewport" aria-label="Interactive Aerathon map">
    <div class="aerathon-map__controls" aria-label="Map zoom controls">
      <button class="aerathon-map__control" type="button" data-map-zoom="in" aria-label="Zoom in">+</button>
      <button class="aerathon-map__control" type="button" data-map-zoom="out" aria-label="Zoom out">-</button>
      <button class="aerathon-map__control" type="button" data-map-zoom="reset" aria-label="Reset map view">Reset</button>
      <button class="aerathon-map__control aerathon-map__pins-toggle" type="button" data-map-export="toggle">Export pins</button>
    </div>
    <details class="aerathon-map__legend" open>
      <summary>Map Key</summary>
      <ul>${legend}</ul>
    </details>
    <div class="aerathon-map__stage">
      <img class="aerathon-map__image" src="${escapeAttribute(
        imageUrl,
      )}" alt="Map of Aerathon" draggable="false" />
      <div class="aerathon-map__pins"></div>
    </div>
    <section class="aerathon-map__popup" hidden aria-live="polite">
      <button class="aerathon-map__popup-close" type="button" aria-label="Close map pin details">&times;</button>
      <h3 class="aerathon-map__popup-title"></h3>
      <p class="aerathon-map__popup-meta"></p>
      <p class="aerathon-map__popup-summary"></p>
      <a class="aerathon-map__popup-link" href="#" target="_blank" rel="noopener noreferrer" hidden>Open record</a>
    </section>
    <section class="aerathon-map__editor" hidden aria-label="Map pin editor">
      <button class="aerathon-map__editor-close" type="button" data-map-editor="cancel" aria-label="Cancel editing pin">&times;</button>
      <h3>Pin Editor</h3>
      <label>Title <input data-map-field="title" /></label>
      <label>Type
        <select data-map-field="type">
          ${markerTypes.map((type) => `<option value="${type.id}">${type.label}</option>`).join("")}
        </select>
      </label>
      <label>Status <input data-map-field="status" /></label>
      <label>Link <input data-map-field="sourceLink" /></label>
      <label>Summary <textarea data-map-field="summary"></textarea></label>
      <div class="aerathon-map__editor-grid">
        <label>X <input data-map-field="x" inputmode="decimal" /></label>
        <label>Y <input data-map-field="y" inputmode="decimal" /></label>
      </div>
      <div class="aerathon-map__editor-actions">
        <button type="button" data-map-editor="save">Save</button>
        <button type="button" data-map-editor="delete">Delete</button>
      </div>
    </section>
    <section class="aerathon-map__pins-panel" hidden aria-label="Export map pins">
      <button class="aerathon-map__pins-close" type="button" data-map-export="close" aria-label="Close exported pins">&times;</button>
      <div class="aerathon-map__pins-panel-header">
        <h3>Export Pins</h3>
        <button class="aerathon-map__pins-copy" type="button" data-map-export="copy">Copy</button>
      </div>
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
                config = (yaml.load(node.value) ?? {}) as RawMapConfig
              } catch (error) {
                config = {
                  image: undefined,
                }
              }

              const htmlNode: Html = {
                type: "html",
                value: renderMap(config, file.data.slug!, ctx.allSlugs ?? []),
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

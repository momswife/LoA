export const MDO_ARCHIVAL_WARNING_PREFIX = "CODE OOC — RESTRICTED AND FORBIDDEN KNOWLEDGE"
export const DEFAULT_SPOILER_WARNING = `${MDO_ARCHIVAL_WARNING_PREFIX} — SPECIFIC CLEARANCE REQUIRED.`
export const SPOILER_READING_TEXT_KEY = "spoilerReadingText"

type SpoilerFrontmatter = {
  spoiler?: unknown
  spoilerWarning?: unknown
}

function asFrontmatter(value: unknown): SpoilerFrontmatter | undefined {
  return value !== null && typeof value === "object" ? (value as SpoilerFrontmatter) : undefined
}

export function isSpoilerFrontmatter(value: unknown): boolean {
  return asFrontmatter(value)?.spoiler === true
}

export function spoilerWarningFor(_value: unknown): string {
  // Never disclose the subject through an authored warning or search excerpt.
  return DEFAULT_SPOILER_WARNING
}

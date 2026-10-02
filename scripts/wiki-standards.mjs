export const cycles = [
  "Glintwane",
  "Frostreach",
  "Embermarch",
  "Bloomtide",
  "Goldgrove",
  "Brightmoor",
  "Highsun",
  "Ashvale",
  "Redfall",
  "Duskrend",
  "Hearthwane",
  "Snowturn",
]
export const weekdays = ["Dawnsday", "Moonsday", "Wardsday", "Firesday", "Gildsday", "Veilsday"]
export const rankLevels = {
  "D-Rank": "1–4",
  "C-Rank": "5–10",
  "B-Rank": "11–15",
  "A-Rank": "16–19",
  "S-Rank": "20",
}

// Check explicit civil dates, not elapsed durations or historical regional reckonings.
export function checkCalendar(text) {
  const errors = []
  const lines = text.replace(/```[\s\S]*?```/gu, (m) => m.replace(/[^\n]/gu, " ")).split("\n")
  const monthNames = cycles.join("|")
  const dayNames = weekdays.join("|")
  for (const [i, original] of lines.entries()) {
    if (/Original Record:|Legacy source date:/iu.test(original)) continue
    const line = original
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/gu, (_, target, label) => label ?? target)
      .replace(/[*_`]/gu, "")
    const report = (message) => errors.push(`line ${i + 1}: ${message}`)
    for (const match of line.matchAll(/\b(\d+)(?:st|nd|rd|th) Cycle,?\s+(\d+)\s*A\.D\./gu)) {
      report(`ordinal Cycle date "${match[0]}" must use a named Cycle or explicitly uncertain date`)
    }
    for (const match of line.matchAll(
      new RegExp(
        `(?:(?<weekday>${dayNames}),?\\s+)?(?<day>\\d{1,2})(?:st|nd|rd|th)?\\s+(?<month>${monthNames})(?:,?\\s+\\d+\\s*A\\.D\\.)?`,
        "gu",
      ),
    )) {
      const { day, weekday } = match.groups
      if (+day < 1 || +day > 30) report(`Span ${day} is outside 1–30`)
      else if (weekday && weekday !== weekdays[(+day - 1) % 6])
        report(`${weekday} does not match Span ${day}; expected ${weekdays[(+day - 1) % 6]}`)
    }
    for (const match of line.matchAll(
      new RegExp(`\\b(?:${monthNames})\\s+(\\d{1,2})(?:[–-](\\d{1,2}))?\\b`, "gu"),
    )) {
      // Month-year precision is valid; only match a whole one/two-digit Span.
      for (const day of match.slice(1).filter(Boolean))
        if (+day < 1 || +day > 30) report(`Span ${day} is outside 1–30`)
    }
    for (const match of line.matchAll(/\b(\d{4})\.(\d{2})\.(\d{2})\b/gu)) {
      if (+match[2] < 1 || +match[2] > 12 || +match[3] < 1 || +match[3] > 30)
        report(`invalid ledger date ${match[0]}`)
    }
    const withoutUncertainDates = line.replace(/legacy cycle \d+; civil date unresolved/giu, "")
    if (/\bCycle\s+\d{3,}\b/iu.test(withoutUncertainDates))
      report(
        "ambiguous absolute Cycle number; use a civil year or explicit source-date uncertainty",
      )
  }
  return errors
}

// A run of outer-pipe rows needs a separator immediately after its header.
export function checkTableHeaders(text) {
  const lines = text.replace(/```[\s\S]*?```/gu, "").split("\n")
  const errors = []
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*\|.*\|\s*$/u.test(lines[i])) continue
    const start = i
    while (i + 1 < lines.length && /^\s*\|.*\|\s*$/u.test(lines[i + 1])) i++
    if (i > start && !/^\s*\|\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)+\|\s*$/u.test(lines[start + 1])) {
      errors.push(`line ${start + 1}: pipe table requires a header separator`)
    }
  }
  return errors
}

export function checkRankMetadata(metadata) {
  const errors = []
  const facts = metadata.facts ?? {}
  if (metadata.recordType === "Delver Profile") {
    const rank = facts.Rank
    if (!(rank in rankLevels)) errors.push("Delver Profile requires a standard personal Rank")
    if (facts["Level (OOC)"] !== undefined) {
      const level = Number(facts["Level (OOC)"])
      const [low, high = low] = (rankLevels[rank] ?? "").split("–").map(Number)
      if (!Number.isInteger(level) || level < low || level > high)
        errors.push("Level (OOC) does not match Rank")
    }
  }
  const mission = facts["Mission Rank"]
  if (mission !== undefined && mission !== "Unranked" && mission !== "Unverified") {
    if (!(mission in rankLevels))
      errors.push("Mission Rank must be D-Rank through S-Rank, Unranked, or Unverified")
    else if (String(facts["Recommended Levels"] ?? "").replace(/-/gu, "–") !== rankLevels[mission])
      errors.push("Recommended Levels must match Mission Rank")
    if (!facts["Team Requirements"]) errors.push("ranked mission requires Team Requirements")
  }
  return errors
}

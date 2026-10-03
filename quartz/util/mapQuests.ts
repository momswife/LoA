/** Only these player-facing fields may enter the map payload. */
export type MapQuest = { id: string; title: string; hook: string }

export function normalizeMapQuests(value: unknown): MapQuest[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value.flatMap((entry): MapQuest[] => {
    if (!entry || typeof entry !== "object") return []
    const { id, title, hook } = entry as Record<string, unknown>
    if (
      typeof id !== "string" ||
      !/^MAL-Q\d{2}$/.test(id) ||
      seen.has(id) ||
      typeof title !== "string" ||
      !title.trim() ||
      typeof hook !== "string" ||
      !hook.trim()
    )
      return []
    seen.add(id)
    return [{ id, title: title.trim(), hook: hook.trim() }]
  })
}

export function mapQuestYaml(quests: MapQuest[] | undefined): string[] {
  if (!quests?.length) return []
  return [
    "    quests:",
    ...normalizeMapQuests(quests).flatMap((quest) => [
      `      - id: ${JSON.stringify(quest.id)}`,
      `        title: ${JSON.stringify(quest.title)}`,
      `        hook: ${JSON.stringify(quest.hook)}`,
    ]),
  ]
}

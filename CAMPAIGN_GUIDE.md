# Private campaign workspace

Open `private/campaign/START HERE.md` for the local campaign notebook. It holds sessions, party characters, plot lines, and ideas that can inform future wiki writing.

The notebook is outside the site's `content/` input directory and is ignored by Git through the existing `private/` rule. It is not included in the normal website build or repository pushes. Keep a separate private backup: Git will not back these notes up. The notebook is ordinary local Markdown, not an encrypted store.

## Capture and connect

1. Paste rough notes into `private/campaign/Inbox.md`, or copy a template into Sessions, Characters, or Plots.
2. Record what happened separately from rumors, player interpretations, and future plans. Use real session dates and in-world dates as separate fields; leave unknown dates unknown.
3. Link recurring characters, places, and plot threads. Include exact public wiki paths when useful; links can point from private notes to public pages, never back from the website into private notes.
4. Update the local dashboard and relevant indexes. Preserve session accounts; summarize current character and plot states in their own records.
5. Put possible public consequences or inspired articles in `Wiki Candidates.md`. A candidate may be a played event or an original idea, but its origin should remain clear.

You can open `private/campaign/` as a separate Obsidian vault, or edit its Markdown files in Codex or another editor. For public references from that separate vault, use the site's URL or record the repository-relative path as plain text; cross-vault wikilinks do not resolve automatically.

## Turn play into wiki material

When asked to adapt campaign developments, the assistant reads relevant local notes, checks the public canon, and drafts changes in the appropriate archive layer:

- **Annals & Antiquities:** completed events and retrospective accounts.
- **The Living Atlas:** lasting changes to people, places, institutions, or ordinary life.
- **Monthly Ledger:** current offers, rumors, restrictions, and developing situations, with lifecycle fields.

Campaign truth and public knowledge are different. A secret villain's identity can be true in the campaign while the public article only records unexplained disappearances. Preserve that distinction. A planned scene is not an event that has happened, and a character's belief is not automatically established truth.

Candidate states are **Idea**, **Ready**, **Applied**, or **Deferred**. Mark Ready when the proposed public wording or facts may be used in an authorized wiki update. The assistant may suggest candidates from other notes but must not expose private sections, real player details, or unrevealed plot material by default. Existing user authorization still applies; this workflow is not a requirement to repeatedly approve already-authorized work.

For each applied candidate, retain the source session or idea, affected public pages, a brief summary of the change, and unresolved follow-ups in the private notebook. Public articles must stand on their own without links to private files. Resolve contradictions with established canon explicitly; do not silently turn a session transcription error into a retcon.

This is an assistant-assisted workflow, not an automatic synchronization service. Adding a note does not itself modify or publish the wiki. Ask, for example: “Review the new session notes and suggest wiki updates,” or “Apply the Ready campaign candidates to the wiki.”

## Finding the notes

Normal repository searches may omit Git-ignored files. For campaign work, search explicitly:

```powershell
rg --files --hidden --no-ignore private/campaign
rg --no-ignore -n 'character or location name' private/campaign
```

If the private folder is absent on another checkout, report that it is unavailable; do not assume the campaign has no history. This guide contains no campaign secrets and can remain in the repository.

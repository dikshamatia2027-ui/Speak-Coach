<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Derive metric-specific coaching from saved transcripts at display time, so historical attempts receive actionable feedback without rewriting persisted sessions.
- Vocabulary game state lives in its own localStorage store (src/lib/vocab.ts) separate from speaking sessions; AI sentence checks run in a server function so the key stays server-side.

- All app color roles, including charts and the live waveform, use semantic CSS tokens so palette changes apply consistently.

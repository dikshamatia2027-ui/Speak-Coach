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

## Working together (read first)
Two people and two AI tools work on this repo (Saprabh with Claude Code, Diksha with Antigravity).
- At the start of every task: `git fetch origin`, check `git log --oneline HEAD..origin/main`, and read the newest entries in `CHANGES.md`. Tell the user what changed on `main` since they last worked.
- Work on a branch and merge `origin/main` into it if `main` has moved. Never rebase or force-push.
- With every change you push, add an entry at the top of the Log in `CHANGES.md` (template in that file). Never put keys or user data in it.

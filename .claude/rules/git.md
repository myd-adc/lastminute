# Git and deploy

- Push to `main` → `.github/workflows/deploy-web.yml` publishes the web export to https://myd-adc.github.io/lastminute/ (`404.html` = `index.html` for deep links).
- Remote: `git@github-personal:myd-adc/lastminute.git`. Author email: `malugamikola@gmail.com` (repo-local config).
- Never add `Co-Authored-By` or any Claude/AI attribution to commits or PR descriptions.
- Commit or push only when asked. Rewrite pushed history (`--amend`, rebase + force push) only on explicit request, always with `git push --force-with-lease`.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), in English, subject line only:

```
<type>(<optional scope>): <summary>
```

- **type:** `feat` (new user-facing behaviour), `fix` (bug), `refactor` (no behaviour change), `style` (visual/UI polish), `chore` (deps, config, tooling), `ci`, `docs`, `perf`, `test`.
- **scope** (optional): `feed`, `room`, `chat`, `album`, `onboarding`, `profile`, `store`, `ui`, `web`, `deploy`.
- **summary:** imperative mood, lower case, no trailing period, ≤ 72 chars (`feat(room): add swipe queue for people going`, not `Added room.`).
- **No body / description.** The subject line is the whole message.
- One logical change per commit; don't mix refactors with features.

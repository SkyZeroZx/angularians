# Collector

Collects the pull requests that landed in angular/angular and writes the contributor files the app reads.
Based on [nuxt/nuxters](https://github.com/nuxt/nuxters) (MIT, Copyright (c) 2023 Nuxt).

## What counts

A PR has landed if GitHub marks it merged, **or** a commit on the default branch has a `PR Close #N` line for it.
angular/angular's merge tool pushes the commits itself and closes the PR, so GitHub shows most PRs from
2017 to 2025 as closed, not merged. The landed PR is credited to its author. Scoring rules are in
`shared/src/scoring.ts` and `shared/src/pull-requests.ts`.

## Run it

```bash
GITHUB_TOKEN=… pnpm collect                                 # full history → data/
GITHUB_TOKEN=… pnpm collect -- --since=90d --out=/tmp/test  # a quick test run, marked partial in meta.json
```

| Flag | Env var | Default | |
|---|---|---|---|
| `--repos=a/b,c/d` | `COLLECT_REPOS` | `angular/angular` | |
| `--since=90d` or `--since=2026-08-01` | `COLLECT_SINCE` | full history | Test runs only |
| `--pulls=rest\|search` | `COLLECT_PULLS` | `rest` | `search` when `/pulls` is not reachable: same data, more requests |
| `--no-profiles` | `COLLECT_PROFILES=false` | profiles on | Profiles need GraphQL, so a token |
| `--out=dir` | `CONTRIBUTORS_OUTPUT_DIR` | `data/` | |
| | `COLLECT_CACHE_DIR` | `.cache/` | The treeless git clone of the repo |

Commits come from a local treeless git clone (commit messages only, about 16 MB), not the API.
A full run needs about 450 REST requests and a few dozen GraphQL points: the built-in GitHub Actions token is enough.

## Output

- `contributors.json` (all time), `contributors-30d.json`, `contributors-12m.json`, `contributors-<year>.json` from 2014:
  one record per line, sorted by score then username.
- `profiles.json`: name, website, social accounts and country of every all-time contributor who set any.
  If GraphQL fails, the previous file is kept.
- `meta.json`: when, what, and counts (landed by merge vs by `PR Close`).

A full run with fewer than 1,000 contributors writes nothing: it is most likely broken.

The run prints `Possible bots:`. Add real bots to `KNOWN_BOT_ACCOUNTS` in `shared/src/bots.ts`.

`.github/workflows/collect.yml` runs it nightly and commits `data/`.

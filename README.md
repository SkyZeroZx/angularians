<p align="center"><img src="app/public/logo-animated.svg" width="96" height="96" alt="The Angularians mark"></p>

# Angularians

Everyone who has contributed to Angular since 2014, ranked: landed pull requests, issues, comments and code reviews in
[angular/angular](https://github.com/angular/angular), [angular/components](https://github.com/angular/components),
[angular/angular-cli](https://github.com/angular/angular-cli) and [angular/dev-infra](https://github.com/angular/dev-infra).
Updated every night at [angularians.netlify.app](https://angularians.netlify.app).

A community project, not affiliated with Google or the Angular team. Angular is a trademark of Google LLC.
It is a port of the [Nuxters](https://nuxt.com/nuxters) leaderboard of nuxt.com to Angular: see
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## How the score works

Every contribution counts for its author, on the day it was made. Landed pull requests, by type:

| Type | Points | PR title prefixes |
|---|---|---|
| feat | 7 | `feat`, `perf` |
| fix | 5 | `fix` |
| docs | 4 | `docs` |
| chore | 3 | `chore`, `ci`, `build`, `test`, `refactor`, `style`, `release`, `revert` |

Everything else, with the weights of Nuxters plus review comments:

| Contribution | Points |
|---|---|
| Issue | 1 |
| Helpful issue (closed as completed, or 3+ reactions, or 5+ comments) | +3 |
| Review comment (inline, on the code of a PR) | 1 |
| Comment (on an issue or a PR) | 0.5 |
| Helpful comment (3+ reactions) | +2 |
| Reaction received (on the day of the issue, PR or comment) | 0.1 |

The sum is rounded once. A PR has landed if GitHub marks it merged, **or** a commit on `main` has a `PR Close #N` line for it: Angular's
merge tooling pushes the commits itself and closes the PR, so GitHub shows most PRs from 2017 to 2025 as closed,
not merged. Bots are left out. Periods: all time, last 30 days, last 12 months, and each year from 2014.

## Layout

| Folder | |
|---|---|
| [`shared/`](./shared) | Types, scoring, PR type rules, periods, countries. Used by both others. |
| [`collector/`](./collector) | Collects landed PRs, issues, comments, review comments and GitHub profiles, writes `data/`. Runs nightly in GitHub Actions. |
| [`app/`](./app) | The site: [Analog](https://analogjs.org) (Angular 22, SSR), [spartan/ui](https://www.spartan.ng), Tailwind. |
| [`data/`](./data) | The collector's output: `contributors*.json`, `profiles.json`, `meta.json`. Committed. |

## Develop

Node 22.18+ (24 recommended, used on Netlify and in CI) and pnpm 10.

```bash
pnpm install
pnpm --filter @angularians/app dev   # http://localhost:5173
pnpm test                                     # every package
pnpm typecheck
```

The app bundles `data/` at build time (`app/scripts/bundle-data.ts`). To try it with another data folder:
`CONTRIBUTORS_DATA_DIR=/path/to/data pnpm --filter @angularians/app build`.

## Data

```bash
GITHUB_TOKEN=… pnpm collect                                # full history → data/ (minutes)
GITHUB_TOKEN=… pnpm collect -- --since=90d --out=/tmp/test # quick test run
```

See [collector/README.md](./collector/README.md). The workflow in `.github/workflows/collect.yml` runs it every
night (about 2 hours) with the `COLLECT_TOKEN` secret and commits `data/`; that commit triggers a new deploy.

## Deploy

Netlify, configured in [`netlify.toml`](./netlify.toml): the build runs Nitro's `netlify` preset, static assets go to
the CDN and every page is rendered by one function. Pages and API responses are cached by the CDN for an hour;
each deploy clears that cache.

## Public API

| Route | |
|---|---|
| `GET /api/contributors?period=12m&country=TR&page=1` | One page (100) of the leaderboard |
| `GET /api/contributors/:username` | A profile: all-time stats, rank in each period, links |
| `GET /api/search/contributors?q=cris` | Up to 8 contributors |
| `GET /api/map/contributors?period=all` | Contributors by country |

## License

[MIT](./LICENSE). Ported code keeps the MIT notices of NuxtLabs and Nuxt: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

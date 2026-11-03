# Angular Contributors

Everyone whose pull requests landed in [angular/angular](https://github.com/angular/angular) since 2014, ranked by
what they shipped: features, fixes, docs and chores. Updated every night.

A community project, not affiliated with Google or the Angular team. Angular is a trademark of Google LLC.
It is a port of the [Nuxters](https://nuxt.com/nuxters) leaderboard of nuxt.com to Angular: see
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## How the score works

Only landed pull requests count, for their author, on the day they landed:

| Type | Points | PR title prefixes |
|---|---|---|
| feat | 7 | `feat`, `perf` |
| fix | 5 | `fix` |
| docs | 4 | `docs` |
| chore | 3 | `chore`, `ci`, `build`, `test`, `refactor`, `style`, `release`, `revert` |

A PR has landed if GitHub marks it merged, **or** a commit on `main` has a `PR Close #N` line for it: Angular's
merge tooling pushes the commits itself and closes the PR, so GitHub shows most PRs from 2017 to 2025 as closed,
not merged. Bots are left out. Periods: all time, last 30 days, last 12 months, and each year from 2014.

## Layout

| Folder | |
|---|---|
| [`shared/`](./shared) | Types, scoring, PR type rules, periods, countries. Used by both others. |
| [`collector/`](./collector) | Collects the landed PRs and GitHub profiles, writes `data/`. Runs nightly in GitHub Actions. |
| [`app/`](./app) | The site: [Analog](https://analogjs.org) (Angular 22, SSR), [spartan/ui](https://www.spartan.ng), Tailwind. |
| [`data/`](./data) | The collector's output: `contributors*.json`, `profiles.json`, `meta.json`. Committed. |

## Develop

Node 22.18+ (24 recommended, used on Netlify and in CI) and pnpm 10.

```bash
pnpm install
pnpm --filter @angular-contributors/app dev   # http://localhost:5173
pnpm test                                     # every package
pnpm typecheck
```

The app bundles `data/` at build time (`app/scripts/bundle-data.ts`). To try it with another data folder:
`CONTRIBUTORS_DATA_DIR=/path/to/data pnpm --filter @angular-contributors/app build`.

## Data

```bash
GITHUB_TOKEN=… pnpm collect                                # full history → data/ (minutes)
GITHUB_TOKEN=… pnpm collect -- --since=90d --out=/tmp/test # quick test run
```

See [collector/README.md](./collector/README.md). The workflow in `.github/workflows/collect.yml` runs it every
night with the built-in token and commits `data/`; that commit triggers a new deploy.

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

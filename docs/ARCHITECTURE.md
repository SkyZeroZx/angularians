# Architecture

A pnpm workspace of three packages and the data they share.

| Folder | |
| --- | --- |
| [`shared/`](../shared) | Types, scoring, PR type rules, periods, countries, the repositories on the board. Used by both others. |
| [`collector/`](../collector) | Collects landed PRs, issues, comments, review comments and GitHub profiles, writes `data/`. Runs nightly in GitHub Actions. |
| [`app/`](../app) | The site: [Analog](https://analogjs.org) (Angular 22, server-rendered), [spartan/ui](https://www.spartan.ng), Tailwind 4. |
| [`data/`](../data) | The collector's output: `contributors*.json`, `profiles.json`, `packages.json`, `team.json`, `meta.json`. Committed. |

## Data

Every night `.github/workflows/collect.yml` collects each repository in a job of its own, in parallel, and a last job merges them
into `data/` and commits it; that commit deploys the site. Details: [collector/README.md](../collector/README.md).

## Site

Every page is server-rendered on Netlify by one function (Nitro's `netlify` preset, configured in [`netlify.toml`](../netlify.toml));
static assets go to the CDN. Pages and API responses are cached by the CDN for an hour, and each deploy clears that cache.

The data is read once per server instance from a JSON file next to the server (`app/scripts/bundle-data.ts` writes it,
`app/scripts/copy-data.ts` copies it there): at ~25 MB it is too big to compile into the server.

To try the site with another data folder: `CONTRIBUTORS_DATA_DIR=/path/to/data pnpm build`.

## Sign in with GitHub

Through the user authorization of the `angularians-collector` GitHub App. Only the GitHub id and login are kept, in a sealed,
http-only cookie; GitHub's access token is used once, to ask who signed in. The session is read in the browser
(`/api/auth/me`), never in a cached page. Sign-in stays hidden until the site has these environment variables:

| Variable | |
| --- | --- |
| `GITHUB_CLIENT_ID` | The GitHub App's client id |
| `GITHUB_CLIENT_SECRET` | One of its client secrets |
| `SESSION_SECRET` | 32 characters or more, to seal the cookie |

The App's callback URL is `https://angularians.netlify.app/api/auth/callback`.

## Public API

| Route | |
| --- | --- |
| `GET /api/contributors?period=12m&country=TR&page=1` | One page (100) of the leaderboard |
| `GET /api/contributors/:username` | A profile: all-time stats, rank in each period, links |
| `GET /api/search/contributors?q=cris` | Up to 8 contributors |
| `GET /api/map/contributors?period=all` | Contributors by country |
| `GET /:username/card.png?period=2025` | The Angularian card, 1200×630: the README card and the profile's link preview |

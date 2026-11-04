# Repository guide

Short orientation for anyone, human or automated tool, who changes this repository. Details are in [CONTRIBUTING.md](CONTRIBUTING.md) and `docs/`.

Angularians ranks everyone who has contributed to the Angular repositories: a collector writes `data/` every night, and an Analog site serves it.

## Map

| path | what is there |
| --- | --- |
| `shared/src` | scoring, PR types and scopes, periods, countries, bots, the repositories on the board |
| `collector/src` | the GitHub client, the collection (`main.ts`), parts and their merge (`finalize.ts`, `merge.ts`), the GitHub App token (`auth.ts`) |
| `app/src/app` | the pages, the leaderboard, profiles, the signed-in card and sharing |
| `app/src/server` | the API, sign-in (`auth/`), the Angularian card (`card/`), the data store |
| `data/` | written by the collector; never edit by hand, except to remove a bot from a run |
| `.github/workflows/collect.yml` | the nightly collection, one job per repository |
| `.github/labels.json` | the issue labels; `.github/workflows/labels.yml` applies them on main |
| `docs/` | architecture, scoring |

## Commands

Use Node 24 (`.nvmrc`) and pnpm 10.

```sh
pnpm install
pnpm dev          # the site
pnpm test         # unit tests of every package
pnpm typecheck
pnpm build        # the site, as Netlify builds it
```

## Rules

- Small files, short plain comments, few dependencies.
- Commit messages are `type(scope): summary`, with no trailer lines.
- Run `pnpm test`, `pnpm typecheck` and `pnpm build` before you commit; look at a change to the site in both themes and at phone width.
- Update `docs/` in the same change as the code.
- Never write secrets, tokens, absolute local paths or personal data into the repository.
- Pages are cached by the CDN for everyone: never render the signed-in user into a page; read it in the browser from `/api/auth/me`.
- No gradients: the brand is one flat colour.

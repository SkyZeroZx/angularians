<h1 align="center"><img src="docs/assets/wordmark.svg" height="72" alt="Angularians"></h1>

<p align="center">
  <a href="https://angularians.dev"><img src="https://img.shields.io/badge/live-angularians.dev-A55E00.svg" alt="Live: angularians.dev"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-A55E00.svg" alt="License: MIT"></a>
  <a href="https://github.com/sponsors/erkamyaman"><img src="https://img.shields.io/badge/sponsor-erkamyaman-db61a2?logo=githubsponsors&logoColor=white" alt="Sponsor"></a>
</p>

<p align="center">
  Everyone who has contributed to Angular since 2014, ranked.<br>
  Live at <b><a href="https://angularians.dev">angularians.dev</a></b>, updated every night. Inspired by <a href="https://nuxt.com/nuxters">Nuxters</a>, built for Angular.
</p>

<p align="center">
  <img alt="The Angularians home page: the hero, sign in with GitHub, and the leaderboard" src="docs/assets/screenshot.png" width="800">
</p>

## Quick start

You need Node 24 (`.nvmrc`) and pnpm 10.

```sh
git clone https://github.com/erkamyaman/angularians.git
cd angularians
pnpm install
pnpm dev     # http://localhost:5173, with the data in data/
pnpm test
```

The data is already in `data/`: you do not need a GitHub token to work on the site. To collect it yourself, see
[collector/README.md](collector/README.md).

## Features

- A leaderboard of [angular/angular](https://github.com/angular/angular), [angular/components](https://github.com/angular/components),
  [angular/angular-cli](https://github.com/angular/angular-cli) and [angular/dev-infra](https://github.com/angular/dev-infra): merged pull
  requests, issues, comments and code reviews. [How the score works](docs/SCORING.md).
- The last 30 days, the last 12 months, all time and every year, by country, with a globe.
- A profile for everyone: stats, badges, the packages they contributed to, year by year.
- Sign in with GitHub to see your rank and badges, share your profile and add your Angularian card to your GitHub README.
- A public JSON API. How it all fits: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## The brand

The mark is the Angular shield cut in two: the A of [Norse](https://www.joelcarrouche.net) on one side, a contribution
graph on the other, in amber gold (`#F9AD26`, and `#A55E00` on white) and the grey of empty days. Its construction is in
[`app/scripts/logo`](app/scripts/logo). About the Norse font: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Report security problems through
[SECURITY.md](SECURITY.md).

## Maintainers

<!-- prettier-ignore-start -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/erkamyaman"><img src="https://avatars.githubusercontent.com/u/88717125?v=4&s=100" width="100px;" alt="Erkam Yaman"/><br /><sub><b>Erkam Yaman</b></sub></a><br /><sub>Maintainer</sub></td>
    </tr>
  </tbody>
</table>
<!-- prettier-ignore-end -->

## Contributors

Thanks to everyone who has helped. This project follows the [all-contributors](https://allcontributors.org) specification. Contributions of any kind welcome!

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/erkamyaman"><img src="https://avatars.githubusercontent.com/u/88717125?v=4?s=100" width="100px;" alt="Erkam Yaman"/><br /><sub><b>Erkam Yaman</b></sub></a><br /><a href="https://github.com/erkamyaman/angularians/commits?author=erkamyaman" title="Code">💻</a> <a href="#design-erkamyaman" title="Design">🎨</a> <a href="https://github.com/erkamyaman/angularians/commits?author=erkamyaman" title="Documentation">📖</a> <a href="#infra-erkamyaman" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-erkamyaman" title="Maintenance">🚧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

MIT License © 2026 [Erkam Yaman](https://github.com/erkamyaman). The code ported from Nuxters keeps the MIT notices of NuxtLabs and Nuxt:
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Angularians is an independent community project. It is not affiliated with, or endorsed by, Google or the Angular team.
Angular is a trademark of Google LLC.

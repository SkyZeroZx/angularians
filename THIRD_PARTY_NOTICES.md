# Third-party notices

Angularians is a port of the Nuxters leaderboard. Parts of its code are adapted from these MIT-licensed
projects. Each ported file says where it comes from in a comment at its top.

## nuxt.com

https://github.com/nuxt/nuxt.com: the leaderboard and profile pages, the globe, the country table, the shared
helpers (`app/`, `shared/src/countries.ts`, `shared/src/periods.ts`, `shared/src/files.ts`, `shared/src/scoring.ts`).

```
MIT License

Copyright (c) 2022-2023 NuxtLabs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## nuxt/nuxters

https://github.com/nuxt/nuxters: the collector, the score weights, the PR type rules, the bot filter and the
location matching (`collector/`, `shared/src/pull-requests.ts`, `shared/src/bots.ts`, `shared/src/location.ts`).

```
MIT License

Copyright (c) 2023 Nuxt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## spartan/ui

https://github.com/spartan-ng/spartan: the helm components copied into `app/src/ui/` (MIT). Two local changes are
marked in the code: a `buttonAriaLabel` input on the select trigger, and the progress indicator filling by value / max.

## Data

- Country names and coordinates: [GeoNames](https://www.geonames.org), CC BY 4.0.
- Contributions: the public GitHub API, for the public repository angular/angular.
- Avatars are served by GitHub (avatars.githubusercontent.com), not stored here.

Angular is a trademark of Google LLC. This project is not affiliated with Google or the Angular team.

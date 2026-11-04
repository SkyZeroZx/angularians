import { canonicalPackage, packageRepo } from '@angularians/shared';
import {
  lucideAppWindow, lucideAtom, lucideBlocks, lucideBookOpen, lucideBoxes, lucideBug, lucideCalendar, lucideCircleArrowUp, lucideCode, lucideCog, lucideComponent, lucideCpu, lucideFlaskConical, lucideGauge, lucideGlobe, lucideHammer, lucideLanguages, lucideLayers, lucideMap, lucideMessageSquareCode, lucidePackage, lucidePalette, lucidePlay, lucideRadioTower, lucideRoute, lucideServer, lucideSparkles, lucideSprout, lucideSquareTerminal, lucideTextCursorInput, lucideTimer, lucideWandSparkles, lucideWorkflow,
} from '@ng-icons/lucide';


/**
 * What a package of `packages.json` is, under its name:
 * - a PR scope of angular/angular (`router`): its npm package (`@angular/router`), or the repository for scopes
 *   that are not a published package (bazel…);
 * - a package of the other repositories, an npm name already (`@angular/material`, `@angular/build`): its repository.
 */
const PACKAGES: Record<string, string> = {
  'animations': '@angular/animations',
  'common': '@angular/common',
  'http': '@angular/common/http',
  'compiler': '@angular/compiler',
  'compiler-cli': '@angular/compiler-cli',
  'core': '@angular/core',
  'elements': '@angular/elements',
  'forms': '@angular/forms',
  'language-service': '@angular/language-service',
  'localize': '@angular/localize',
  'platform-browser': '@angular/platform-browser',
  'platform-browser-dynamic': '@angular/platform-browser-dynamic',
  'platform-server': '@angular/platform-server',
  'router': '@angular/router',
  'service-worker': '@angular/service-worker',
  'upgrade': '@angular/upgrade',
  'zone.js': 'zone.js',
  'benchpress': '@angular/benchpress',
  'devtools': 'Angular DevTools',
  'docs': 'angular.dev',
  'docs-infra': 'angular.dev',
  'migrations': '@angular/core schematics',
}

export function packageLabel(name: string): string {
  return packageRepo(name) === 'angular/angular' ? PACKAGES[name] ?? 'angular/angular' : packageRepo(name)
}

/**
 * A Lucide icon for what a package does (`@ng-icons/lucide` names, all in `PACKAGE_ICONS` for `provideIcons`). A package without its own falls back to its repository's.
 */
const ICONS: Record<string, string> = {
  // angular/angular
  'core': 'lucideAtom',
  'common': 'lucideBoxes',
  'http': 'lucideGlobe',
  'compiler': 'lucideCpu',
  'compiler-cli': 'lucideSquareTerminal',
  'ivy': 'lucideSprout',
  'router': 'lucideRoute',
  'forms': 'lucideTextCursorInput',
  'animations': 'lucideSparkles',
  'elements': 'lucideComponent',
  'localize': 'lucideLanguages',
  'platform-browser': 'lucideAppWindow',
  'platform-browser-dynamic': 'lucideAppWindow',
  'platform-server': 'lucideServer',
  'service-worker': 'lucideRadioTower',
  'upgrade': 'lucideCircleArrowUp',
  'zone.js': 'lucideTimer',
  'language-service': 'lucideMessageSquareCode',
  'language-server': 'lucideMessageSquareCode',
  'vscode-extension': 'lucideCode',
  'devtools': 'lucideBug',
  'docs': 'lucideBookOpen',
  'docs-infra': 'lucideBookOpen',
  'shared-docs': 'lucideBookOpen',
  'migrations': 'lucideWandSparkles',
  'schematics': 'lucideWandSparkles',
  'benchpress': 'lucideGauge',
  'benchmarks': 'lucideGauge',
  'bazel': 'lucideCog',
  'dev-infra': 'lucideCog',
  // angular/components
  '@angular/material': 'lucidePalette',
  '@angular/cdk': 'lucideLayers',
  '@angular/material-experimental': 'lucideFlaskConical',
  '@angular/cdk-experimental': 'lucideFlaskConical',
  '@angular/google-maps': 'lucideMap',
  '@angular/youtube-player': 'lucidePlay',
  '@angular/material-luxon-adapter': 'lucideCalendar',
  '@angular/material-moment-adapter': 'lucideCalendar',
  '@angular/material-date-fns-adapter': 'lucideCalendar',
  // angular/angular-cli
  '@angular/cli': 'lucideSquareTerminal',
  '@angular/build': 'lucideHammer',
  '@angular-devkit/build-angular': 'lucideHammer',
  '@angular/ssr': 'lucideServer',
  '@schematics/angular': 'lucideWandSparkles',
  '@angular-devkit/schematics': 'lucideWandSparkles',
  '@angular-devkit/schematics-cli': 'lucideWandSparkles',
  '@angular-devkit/architect': 'lucideWorkflow',
  '@angular-devkit/core': 'lucideCog',
  '@ngtools/webpack': 'lucideBlocks',
}

/** The icon of each repository, for its packages without one of their own. */
const REPO_ICONS: Record<string, string> = {
  'angular/angular': 'lucidePackage',
  'angular/components': 'lucideComponent',
  'angular/angular-cli': 'lucideSquareTerminal',
}

export function packageIcon(name: string): string {
  return ICONS[name] ?? REPO_ICONS[packageRepo(name)] ?? 'lucidePackage'
}

/** Every icon `packageIcon` can name, for `provideIcons`. */
export const PACKAGE_ICONS = { lucideAppWindow, lucideAtom, lucideBlocks, lucideBookOpen, lucideBoxes, lucideBug, lucideCalendar, lucideCircleArrowUp, lucideCode, lucideCog, lucideComponent, lucideCpu, lucideFlaskConical, lucideGauge, lucideGlobe, lucideHammer, lucideLanguages, lucideLayers, lucideMap, lucideMessageSquareCode, lucidePackage, lucidePalette, lucidePlay, lucideRadioTower, lucideRoute, lucideServer, lucideSparkles, lucideSprout, lucideSquareTerminal, lucideTextCursorInput, lucideTimer, lucideWandSparkles, lucideWorkflow }

/** A contributor's packages with misspelled scopes folded into the package they mean, most PRs first. */
export function foldPackages(packages: ReadonlyArray<{ name: string, pullRequests: number }>): Array<{ name: string, pullRequests: number }> {
  const counts = new Map<string, number>()
  for (const { name, pullRequests } of packages) {
    const key = canonicalPackage(name)
    counts.set(key, (counts.get(key) ?? 0) + pullRequests)
  }
  return [...counts].map(([name, pullRequests]) => ({ name, pullRequests })).sort((a, b) => b.pullRequests - a.pullRequests || a.name.localeCompare(b.name))
}

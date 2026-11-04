import { packageRepo } from '@angularians/shared';

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

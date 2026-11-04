/**
 * The npm package of a PR scope of angular/angular (`fix(router): …` → `@angular/router`).
 * Scopes that are not a published package (docs-infra, bazel, migrations…) keep their name only.
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

export function packageLabel(scope: string): string {
  return PACKAGES[scope] ?? 'angular/angular'
}

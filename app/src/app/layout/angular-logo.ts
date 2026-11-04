import { ChangeDetectionStrategy, Component } from '@angular/core';

let nextId = 0;

/**
 * The gradient Angular icon, from the Angular press kit (https://angular.dev/press-kit), CC BY 4.0, © Google.
 * Only to say "member of the Angular team": the site's own mark is the Angularians A.
 * Each instance gets its own gradient ids, so several on a page do not share (and break) each other's.
 */
@Component({
  selector: 'app-angular-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block shrink-0' },
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 223 236" class="size-full" aria-hidden="true">
      <g [attr.clip-path]="'url(#' + id + 'a)'">
        <path [attr.fill]="'url(#' + id + 'b)'" [attr.d]="shape" />
        <path [attr.fill]="'url(#' + id + 'c)'" [attr.d]="shape" />
      </g>
      <defs>
        <linearGradient [attr.id]="id + 'b'" x1="49.009" x2="225.829" y1="213.75" y2="129.722" gradientUnits="userSpaceOnUse">
          <stop stop-color="#E40035" />
          <stop offset=".24" stop-color="#F60A48" />
          <stop offset=".352" stop-color="#F20755" />
          <stop offset=".494" stop-color="#DC087D" />
          <stop offset=".745" stop-color="#9717E7" />
          <stop offset="1" stop-color="#6C00F5" />
        </linearGradient>
        <linearGradient [attr.id]="id + 'c'" x1="41.025" x2="156.741" y1="28.344" y2="160.344" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FF31D9" />
          <stop offset="1" stop-color="#FF5BE1" stop-opacity="0" />
        </linearGradient>
        <clipPath [attr.id]="id + 'a'"><path fill="#fff" d="M0 0h223v236H0z" /></clipPath>
      </defs>
    </svg>
  `,
})
export class AngularLogo {
  protected readonly id = `angular-logo-${nextId++}-`;
  protected readonly shape = 'm222.077 39.192-8.019 125.923L137.387 0l84.69 39.192Zm-53.105 162.825-57.933 33.056-57.934-33.056 11.783-28.556h92.301l11.783 28.556ZM111.039 62.675l30.357 73.803H80.681l30.358-73.803ZM7.937 165.115 0 39.192 84.69 0 7.937 165.115Z';
}

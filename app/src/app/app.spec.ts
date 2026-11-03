import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideLocationMocks()],
    }).compileComponents();
  });

  it('renders the header, the main landmark and the unofficial notice', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('app-site-header')?.textContent).toContain('Angular Contributors');
    expect(element.querySelector('main#main')).toBeTruthy();
    expect(element.querySelector('app-site-footer')?.textContent).toContain('not affiliated with Google');
  });
});

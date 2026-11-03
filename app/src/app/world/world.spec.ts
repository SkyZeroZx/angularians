import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { faceOnGlobe, projectOnGlobe } from './globe-math';
import { World } from './world';

describe('globe math', () => {
  it('puts the point the camera faces in the middle, on the visible side', () => {
    for (const location of [[48.86, 2.35], [-33.87, 151.21], [40.71, -74.01], [0, 0]] as const) {
      const { phi, theta } = faceOnGlobe(location);
      const out = { depth: 0, x: 0, y: 0 };
      projectOnGlobe(out, location, phi, theta, 1);
      expect(out.x).toBeCloseTo(0, 6);
      expect(out.y).toBeCloseTo(0, 6);
      expect(out.depth).toBeGreaterThan(0.7);
    }
  });

  it('hides the opposite side of the globe', () => {
    const { phi, theta } = faceOnGlobe([0, 0]);
    const out = { depth: 0, x: 0, y: 0 };
    projectOnGlobe(out, [0, 180], phi, theta, 1);
    expect(out.depth).toBeLessThan(0);
  });
});

describe('World', () => {
  const map = {
    period: '12m',
    total: 10,
    located: 6,
    countries: [{ code: 'US', count: 4, top: ['a', 'b', 'c'] }, { code: 'TR', count: 2, top: ['d', 'e'] }],
  };

  function render(selected: string | null, people: Array<{ githubId: number, username: string, rank: number, score: number }> = []) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(World);
    fixture.componentRef.setInput('map', map);
    fixture.componentRef.setInput('selected', selected);
    fixture.componentRef.setInput('people', people);
    fixture.detectChanges();
    return fixture;
  }

  it('lists countries from the most contributors, with how many set a location', () => {
    const element: HTMLElement = render(null).nativeElement;
    const rows = [...element.querySelectorAll('ol li button')].map(button => button.textContent!.replace(/\s+/g, ' ').trim());
    expect(rows).toEqual(['United States4', 'Turkey2']);
    expect(element.textContent).toContain('6 of 10 Angularians set one');
  });

  it('emits the picked country, and null to unpick it', () => {
    const fixture = render('TR');
    const picked: Array<string | null> = [];
    fixture.componentInstance.select.subscribe(value => picked.push(value));
    const buttons = fixture.nativeElement.querySelectorAll('ol li button') as NodeListOf<HTMLButtonElement>;
    buttons[0]!.click();
    buttons[1]!.click();
    expect(picked).toEqual(['US', null]);
    expect(buttons[1]!.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows a card with one tile per contributor, skeletons while they load', () => {
    const loading: HTMLElement = render('TR').nativeElement;
    expect(loading.textContent).toContain('Turkey');
    expect(loading.textContent).toContain('2 Angularians · #2 country');
    expect(loading.querySelectorAll('[aria-label="Best ranked from Turkey"] li [hlmSkeleton]').length).toBeGreaterThan(0);

    TestBed.resetTestingModule();
    const loaded: HTMLElement = render('TR', [{ githubId: 1, username: 'd', rank: 3, score: 9 }, { githubId: 2, username: 'e', rank: 7, score: 5 }]).nativeElement;
    const links = [...loaded.querySelectorAll('[aria-label="Best ranked from Turkey"] li a')].map(a => a.getAttribute('aria-label'));
    expect(links.slice(0, 2)).toEqual(['d, #3', 'e, #7']);
  });
});

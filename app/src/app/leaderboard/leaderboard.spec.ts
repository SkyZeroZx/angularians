import { TestBed } from '@angular/core/testing';
import { avatarUrl, formatDate, formatPoints, plural, profileQuery } from './format';
import { CountrySelect } from './country-select';
import { PeriodTabs } from './period-tabs';

describe('format', () => {
  it('formats points, plurals and dates the same on server and browser', () => {
    expect(formatPoints(1)).toBe('1 pt');
    expect(formatPoints(5539)).toBe('5,539 pts');
    expect(plural(1, 'person', 'people')).toBe('1 person');
    expect(plural(2194, 'person', 'people')).toBe('2,194 people');
    expect(formatDate('2026-11-03T23:59:00Z')).toBe('Nov 3, 2026');
  });

  it('links avatars by GitHub id at 2x, and profiles to the board period', () => {
    expect(avatarUrl(4450522, 112)).toBe('https://avatars.githubusercontent.com/u/4450522?s=224&v=4');
    expect(profileQuery('all')).toEqual({});
    expect(profileQuery('2019')).toEqual({ period: '2019' });
  });
});

describe('PeriodTabs', () => {
  function render(period: string, periods: string[]) {
    const fixture = TestBed.createComponent(PeriodTabs);
    fixture.componentRef.setInput('period', period);
    fixture.componentRef.setInput('periods', periods);
    fixture.detectChanges();
    return fixture;
  }

  it('shows a tab per rolling window and all time, and the years in a picker', () => {
    const element: HTMLElement = render('12m', ['30d', '12m', 'all', '2026', '2025']).nativeElement;
    expect([...element.querySelectorAll('[role="tab"]')].map(tab => tab.textContent?.trim())).toEqual(['30 days', '12 months', 'All time']);
    expect(element.querySelector('[role="combobox"]')?.getAttribute('aria-label')).toBe('Year');
  });

  it('only offers the periods with data', () => {
    const element: HTMLElement = render('all', ['all']).nativeElement;
    expect([...element.querySelectorAll('[role="tab"]')].map(tab => tab.textContent?.trim())).toEqual(['All time']);
    expect(element.querySelector('[role="combobox"]')).toBeNull();
  });

  it('emits a picked tab once, and nothing for the current one', () => {
    const fixture = render('12m', ['30d', '12m', 'all']);
    const picked: string[] = [];
    fixture.componentInstance.periodChange.subscribe(value => picked.push(value));
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    tabs[1]!.click();
    tabs[2]!.click();
    fixture.detectChanges();
    expect(picked).toEqual(['all']);
  });
});

describe('CountrySelect', () => {
  it('stays hidden until profiles give countries', () => {
    const fixture = TestBed.createComponent(CountrySelect);
    fixture.componentRef.setInput('countries', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="combobox"]')).toBeNull();

    fixture.componentRef.setInput('countries', [{ code: 'TR', count: 3, top: [] }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="combobox"]')?.getAttribute('aria-label')).toBe('Filter by country');
  });

  it('keeps showing a picked country with nobody in this period', () => {
    const fixture = TestBed.createComponent(CountrySelect);
    fixture.componentRef.setInput('countries', []);
    fixture.componentRef.setInput('value', 'BG');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Bulgaria');
  });
});

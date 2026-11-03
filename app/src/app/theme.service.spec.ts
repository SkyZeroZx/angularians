import { TestBed } from '@angular/core/testing';
import { ThemeService, THEME_STORAGE_KEY } from './theme.service';

function setSystemDark(dark: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: dark && query.includes('dark'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    TestBed.resetTestingModule();
  });

  it('follows the system setting by default', () => {
    setSystemDark(true);
    const theme = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(theme.preference()).toBe('system');
    expect(theme.dark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('cycles system → light → dark → system, and remembers the choice', () => {
    setSystemDark(false);
    const theme = TestBed.inject(ThemeService);
    theme.cycle();
    expect(theme.preference()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    theme.cycle();
    TestBed.tick();
    expect(theme.preference()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    theme.cycle();
    expect(theme.preference()).toBe('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('restores a saved choice over the system setting', () => {
    setSystemDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const theme = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(theme.dark()).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

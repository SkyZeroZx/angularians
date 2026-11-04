import { TestBed } from '@angular/core/testing';
import { ThemeService, THEME_STORAGE_KEY } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    TestBed.resetTestingModule();
  });

  it('is dark by default, whatever the system setting', () => {
    const theme = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(theme.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles dark → light → dark, remembering only a light choice', () => {
    const theme = TestBed.inject(ThemeService);
    theme.toggle();
    TestBed.tick();
    expect(theme.theme()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    theme.toggle();
    TestBed.tick();
    expect(theme.theme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('restores a saved light theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const theme = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(theme.dark()).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

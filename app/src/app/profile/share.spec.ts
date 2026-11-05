import { TestBed } from '@angular/core/testing';
import { Share } from './share';

describe('Share', () => {
  function links(period: string) {
    const fixture = TestBed.createComponent(Share);
    fixture.componentRef.setInput('username', 'crisbeto');
    fixture.componentRef.setInput('period', period);
    const share = fixture.componentInstance as unknown as { shareLinks(): { x: string, linkedin: string, bluesky: string }, fileName(): string };
    return { ...share.shareLinks(), fileName: share.fileName() };
  }

  it('shares the profile of the period on screen', () => {
    const { x, linkedin, bluesky, fileName } = links('2025');
    expect(new URL(x).searchParams.get('url')).toBe('https://angularians.dev/crisbeto?period=2025');
    expect(new URL(x).searchParams.get('text')).toBe('My contributions to Angular in 2025 on Angularians');
    expect(new URL(linkedin).searchParams.get('url')).toBe('https://angularians.dev/crisbeto?period=2025');
    expect(new URL(bluesky).searchParams.get('text')).toContain('https://angularians.dev/crisbeto?period=2025');
    expect(fileName).toBe('crisbeto-angularian-2025.png');
  });

  it('names the all-time card without a period', () => {
    const { x, fileName } = links('all');
    expect(new URL(x).searchParams.get('url')).toBe('https://angularians.dev/crisbeto');
    expect(fileName).toBe('crisbeto-angularian.png');
  });

  it('carries a picked country to the card, its links and the Markdown', () => {
    const fixture = TestBed.createComponent(Share);
    fixture.componentRef.setInput('username', 'cris');
    fixture.componentRef.setInput('country', 'TR');
    const share = fixture.componentInstance as unknown as { pickFlag(code: string | null): void, previewUrl(): string, markdown(): string, shareLinks(): { linkedin: string } };
    expect(share.previewUrl()).not.toContain('flag=');
    share.pickFlag('DE');
    expect(share.previewUrl()).toContain('&flag=DE');
    expect(share.markdown()).toContain('card.png?flag=DE');
    expect(decodeURIComponent(share.shareLinks().linkedin)).toContain('/cris?flag=DE');
  });
});

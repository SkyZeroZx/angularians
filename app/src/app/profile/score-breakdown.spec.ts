import { TestBed } from '@angular/core/testing';
import { ScoreBreakdown } from './score-breakdown';

describe('ScoreBreakdown', () => {
  it('lists each type as count × points = total, the biggest first', () => {
    const fixture = TestBed.createComponent(ScoreBreakdown);
    fixture.componentRef.setInput('pullRequests', { feat: 16, fix: 66, docs: 134, chore: 33, all: 249 });
    fixture.detectChanges();
    const rows = [...fixture.nativeElement.querySelectorAll('li')].map((li: HTMLElement) => li.querySelector('div')!.textContent!.replace(/\s+/g, ' ').trim());
    expect(rows).toEqual(['Docs PRs 134 × 4 = 536', 'Fix PRs 66 × 5 = 330', 'Feature PRs 16 × 7 = 112', 'Chore PRs 33 × 3 = 99']);
  });

  it('draws the bars on one scale: the biggest full, the others in proportion', () => {
    const fixture = TestBed.createComponent(ScoreBreakdown);
    fixture.componentRef.setInput('pullRequests', { feat: 0, fix: 0, docs: 100, chore: 0, all: 100 });
    fixture.detectChanges();
    fixture.componentRef.setInput('pullRequests', { feat: 0, fix: 2, docs: 5, chore: 0, all: 7 });
    fixture.detectChanges();
    // docs 20 (max), fix 10 (half), feat and chore 0 (empty)
    const transforms = [...fixture.nativeElement.querySelectorAll('hlm-progress-indicator')].map((el: HTMLElement) => el.style.transform);
    expect(transforms).toEqual(['translateX(-0%)', 'translateX(-50%)', 'translateX(-100%)', 'translateX(-100%)']);
  });
});

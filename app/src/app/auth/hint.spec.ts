import { hasSignedInHint } from './hint';

describe('hasSignedInHint', () => {
  it.each([
    ['angularians-signed-in=1', true],
    ['theme=light; angularians-signed-in=1; other=x', true],
    ['angularians-signed-in=0', false],
    ['xangularians-signed-in=1', false],
    ['', false],
    [undefined, false],
  ])('%s → %s', (cookies, expected) => expect(hasSignedInHint(cookies)).toBe(expected));
});

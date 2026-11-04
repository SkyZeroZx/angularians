import { afterSignIn, safeReturnTo } from './return-to'

describe('safeReturnTo', () => {
  it.each([
    ['/JeanMeche', '/JeanMeche'],
    ['/?period=2025', '/?period=2025'],
    ['//evil.example', '/'],
    ['/\\evil.example', '/'],
    ['/\t/evil.example', '/'],
    ['/\n/evil.example', '/'],
    ['/\r/evil.example', '/'],
    ['/x\u007f', '/'],
    ['https://evil.example', '/'],
    ['javascript:alert(1)', '/'],
    [undefined, '/'],
    [['/a'], '/'],
  ])('%s → %s', (value, expected) => expect(safeReturnTo(value)).toBe(expected))
})

describe('afterSignIn', () => {
  it.each([
    [undefined, 'JeanMeche', '/JeanMeche'],
    ['/', 'JeanMeche', '/JeanMeche'],
    ['/?period=2025', 'JeanMeche', '/?period=2025'],
    [undefined, null, '/'],
    ['/', null, '/'],
    ['/?period=2025', null, '/?period=2025'],
  ])('%s, %s → %s', (returnTo, username, expected) => expect(afterSignIn(returnTo, username)).toBe(expected))
})

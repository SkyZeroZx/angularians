import { safeReturnTo } from './return-to'

describe('safeReturnTo', () => {
  it.each([
    ['/JeanMeche', '/JeanMeche'],
    ['/?period=2025', '/?period=2025'],
    ['//evil.example', '/'],
    ['/\\evil.example', '/'],
    ['https://evil.example', '/'],
    ['javascript:alert(1)', '/'],
    [undefined, '/'],
    [['/a'], '/'],
  ])('%s → %s', (value, expected) => expect(safeReturnTo(value)).toBe(expected))
})

import { createVerify, generateKeyPairSync } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { appJwt, currentToken, resetTokenCache } from '../src/auth.ts'

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const pem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString()
const app = { COLLECT_APP_ID: '123', COLLECT_APP_KEY: pem, GITHUB_REPOSITORY: 'erkamyaman/angularians' }

afterEach(() => {
  vi.unstubAllGlobals()
  resetTokenCache()
})

describe('appJwt', () => {
  it('is an RS256 JWT of the App, valid 9 minutes from a minute ago', () => {
    const now = Date.parse('2026-11-04T07:00:00Z')
    const [header, payload, signature] = appJwt('123', pem, now).split('.')
    expect(JSON.parse(Buffer.from(header!, 'base64url').toString())).toEqual({ alg: 'RS256', typ: 'JWT' })
    expect(JSON.parse(Buffer.from(payload!, 'base64url').toString())).toEqual({ iat: now / 1000 - 60, exp: now / 1000 + 540, iss: '123' })
    expect(createVerify('RSA-SHA256').update(`${header}.${payload}`).verify(publicKey, Buffer.from(signature!, 'base64url'))).toBe(true)
  })
})

describe('currentToken', () => {
  const stub = () => {
    let n = 0
    const fetch = vi.fn(async (url: string, _init?: RequestInit) => {
      if (url.endsWith('/repos/erkamyaman/angularians/installation')) return new Response(JSON.stringify({ id: 9 }))
      if (url.endsWith('/app/installations/9/access_tokens')) {
        n++
        return new Response(JSON.stringify({ token: `ghs_${n}`, expires_at: new Date(Date.parse('2026-11-04T08:00:00Z') + (n - 1) * 3600_000).toISOString() }))
      }
      return new Response('{}', { status: 404 })
    })
    vi.stubGlobal('fetch', fetch)
    return fetch
  }

  it('without an App: GITHUB_TOKEN', async () => {
    expect(await currentToken({ GITHUB_TOKEN: 'pat' })).toBe('pat')
  })

  it('with an App: an installation token, kept until 10 minutes before it ends, then a new one', async () => {
    const fetch = stub()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(await currentToken(app, Date.parse('2026-11-04T07:00:00Z'))).toBe('ghs_1')
    expect(await currentToken(app, Date.parse('2026-11-04T07:49:00Z'))).toBe('ghs_1')
    expect(await currentToken(app, Date.parse('2026-11-04T07:51:00Z'))).toBe('ghs_2')
    expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('access_tokens'))).toHaveLength(2)
    // Signed with the App's JWT, not a token.
    expect(fetch.mock.calls[0]![1]?.headers).toMatchObject({ authorization: expect.stringMatching(/^Bearer ey/) })
  })

  it('reads a key pasted with \\n written out', async () => {
    stub()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(await currentToken({ ...app, COLLECT_APP_KEY: pem.replace(/\n/g, '\\n') }, Date.parse('2026-11-04T07:00:00Z'))).toBe('ghs_1')
  })
})

import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { createEvent } from 'h3';
import { vi } from 'vitest';
import callback from '../routes/api/auth/callback.get';
import { contributorsData } from '../data/store';
import { authSession } from './session';

vi.mock('../data/store', () => ({ contributorsData: vi.fn() }));
vi.mock('./session', () => ({
  authSession: vi.fn(),
  callbackUrl: () => 'http://localhost/api/auth/callback',
  requireAuthConfig: () => ({ clientId: 'id', clientSecret: 'secret', password: 'password' }),
  setSignedInHint: vi.fn(),
}));

async function signIn(returnTo: string, profile: () => { username: string } | null) {
  vi.mocked(authSession).mockResolvedValue({ data: { state: 'state', returnTo }, update: vi.fn() } as never);
  vi.mocked(contributorsData).mockImplementation(() => ({ profileById: profile }) as never);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(
    url.includes('access_token') ? { access_token: 'token' } : { id: 7, login: 'renamed' },
  ))));
  const req = new IncomingMessage(new Socket());
  req.method = 'GET';
  req.url = '/api/auth/callback?code=code&state=state';
  const res = new ServerResponse(req);
  await callback(createEvent(req, res));
  return res.getHeader('location');
}

describe('GET /api/auth/callback', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('ends on the profile, by the name in the data', async () => {
    expect(await signIn('/', () => ({ username: 'original' }))).toBe('/original');
  });

  it('ends on the home page with no contributions', async () => {
    expect(await signIn('/', () => null)).toBe('/');
  });

  it('ends on the page it started from', async () => {
    expect(await signIn('/?period=2025', () => null)).toBe('/?period=2025');
  });

  it('still finishes when the data cannot be read', async () => {
    expect(await signIn('/', () => { throw new Error('no data file'); })).toBe('/');
  });
});

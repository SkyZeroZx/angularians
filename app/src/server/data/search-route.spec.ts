import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { createEvent } from 'h3';
import { vi } from 'vitest';
import route from '../routes/api/search/contributors.get';
import { contributorsData } from './store';

vi.mock('./store', () => ({ contributorsData: vi.fn() }));

function get(url: string) {
  const search = vi.fn(() => []);
  vi.mocked(contributorsData).mockReturnValue({ search } as never);
  const req = new IncomingMessage(new Socket());
  req.method = 'GET';
  req.url = url;
  route(createEvent(req, new ServerResponse(req)));
  return search;
}

describe('GET /api/search/contributors', () => {
  it('passes the country, uppercased', () => {
    expect(get('/api/search/contributors?q=cris&country=tr')).toHaveBeenCalledWith('cris', { country: 'TR' });
  });

  it('searches everyone without a country', () => {
    expect(get('/api/search/contributors?q=cris')).toHaveBeenCalledWith('cris', { country: null });
    expect(get('/api/search/contributors?q=cris&country=')).toHaveBeenCalledWith('cris', { country: null });
  });

  it('answers 400 for an unknown country', () => {
    expect(() => get('/api/search/contributors?q=cris&country=NOPE')).toThrow();
  });
});

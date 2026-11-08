import { delay, http, HttpResponse } from 'msw';
import type { PlacePhoto } from '@trip-canvas/contracts';

const TINTS = ['#0ea5e9', '#f59e0b', '#10b981', '#f43f5e'];

/** A local placeholder per index, never a real Google URL. */
function placeholder(index: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="${TINTS[index % TINTS.length]}"/><text x="200" y="165" font-size="40" text-anchor="middle" fill="white">Photo ${index + 1}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** MSW handler for `/api/places/:id/photo`: `count` photos after `ms`, odd ones without an author; 0 answers 404. */
export function photosHandler(count: number, ms: number | 'infinite' = 300) {
  return http.get('/api/places/:id/photo', async ({ request }) => {
    const index = Number(new URL(request.url).searchParams.get('index'));
    await delay(ms);
    if (index >= count) return HttpResponse.json({ error: 'No such photo' }, { status: 404 });
    const photo: PlacePhoto = {
      photoUri: placeholder(index),
      author: index % 2 === 0 ? { name: 'Ana Sousa', url: 'https://example.com/contrib/ana' } : null,
      count,
    };
    return HttpResponse.json(photo);
  });
}

export const photoFails = http.get('/api/places/:id/photo', () =>
  HttpResponse.json({ error: 'Place photo is unavailable' }, { status: 502 }),
);

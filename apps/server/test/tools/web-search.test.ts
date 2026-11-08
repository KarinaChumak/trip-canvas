import { describe, expect, it } from 'vitest';
import { memoryCache } from '../../src/lib/cache.js';
import { createServices } from '../../src/services/index.js';
import { createTools } from '../../src/tools/index.js';
import { MAX_WEB_SEARCHES, webSearch } from '../../src/tools/web-search.js';

describe('webSearch tool', () => {
  it("is Anthropic's server-side web search, capped per reply", () => {
    expect(webSearch).toMatchObject({ id: 'anthropic.web_search_20250305', args: { maxUses: MAX_WEB_SEARCHES } });
  });

  it('is one of the tools the agent sees', () => {
    const services = createServices({ cache: memoryCache(), env: { NOMINATIM_USER_AGENT: 'test', GOOGLE_MAPS_API_KEY: 'test' } });
    expect(createTools(services).webSearch).toBe(webSearch);
  });
});

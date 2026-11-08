import { describe, expect, it } from 'vitest';
import { components } from '../src/catalog.js';
import { buildCatalogPrompt } from '../src/prompt.js';

describe('buildCatalogPrompt', () => {
  it('lists every component with its description', () => {
    const prompt = buildCatalogPrompt();
    for (const [name, { description }] of Object.entries(components)) {
      expect(prompt).toContain(`- ${name}: ${description}`);
    }
  });

  it('tells the model to retry once, then fall back to text', () => {
    expect(buildCatalogPrompt()).toMatch(/call it again once.*plain text/s);
  });
});

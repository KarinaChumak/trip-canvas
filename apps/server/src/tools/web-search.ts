import { anthropic } from '@ai-sdk/anthropic';

/** Each search costs 1 cent plus the result tokens, so cap them per reply. */
export const MAX_WEB_SEARCHES = 2;

/**
 * Claude's own web search: Anthropic runs the search and returns cited results, so
 * there is no client, key or cache on our side. The tool definition doesn't read the
 * provider's API key; the request goes through the chat model's provider.
 */
export const webSearch = anthropic.tools.webSearch_20250305({ maxUses: MAX_WEB_SEARCHES });

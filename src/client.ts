export const VERSION = '0.1.0';
export const USER_AGENT = `stellar-expert-mcp/${VERSION}`;
export const DEFAULT_API_BASE = 'https://api.stellar.expert';
export const OPENAPI_DOCS_URL = 'https://stellar.expert/openapi';

export type Network = 'public' | 'testnet';

export class ExpertApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: string
  ) {
    super(message);
    this.name = 'ExpertApiError';
  }
}

export function getApiBase(): string {
  return (process.env.STELLAR_EXPERT_API_BASE ?? DEFAULT_API_BASE).replace(/\/$/, '');
}

export function getDefaultNetwork(): Network {
  return process.env.STELLAR_EXPERT_NETWORK === 'testnet' ? 'testnet' : 'public';
}

type QueryValue = string | number | boolean | string[] | undefined;

function buildUrl(path: string, query?: Record<string, QueryValue>): URL {
  const url = new URL(`${getApiBase()}${path}`);
  if (!query) {
    return url;
  }
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(`${key}[]`, item);
      }
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

export async function expertGet(
  path: string,
  query?: Record<string, QueryValue>
): Promise<{ status: number; text: string; json: unknown | undefined }> {
  const url = buildUrl(path, query);
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json, text/plain;q=0.9',
      'User-Agent': USER_AGENT
    }
  });
  const text = await res.text();
  if (!res.ok) {
    throw new ExpertApiError(res.status, `HTTP ${res.status} for ${url.pathname}`, text);
  }
  let json: unknown | undefined;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('json')) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = undefined;
    }
  }
  return { status: res.status, text, json };
}

export type ToolContent = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

export function textResult(text: string, isError = false): ToolContent {
  return { content: [{ type: 'text', text }], isError };
}

export function jsonResult(data: unknown): ToolContent {
  return textResult(JSON.stringify(data, null, 2));
}

export async function fromApi(
  run: () => Promise<{ text: string; json: unknown | undefined }>
): Promise<ToolContent> {
  try {
    const { text, json } = await run();
    if (json !== undefined) {
      return jsonResult(json);
    }
    return textResult(text);
  } catch (error) {
    if (error instanceof ExpertApiError) {
      if (error.status === 429) {
        return textResult(
          'StellarExpert API rate limited (HTTP 429). Cache results or group queries on the caller side, then retry after a short delay.',
          true
        );
      }
      if (error.status === 404) {
        return textResult(
          `StellarExpert API not found (HTTP 404).${error.body ? `\n${error.body}` : ''}`,
          true
        );
      }
      return textResult(
        `StellarExpert API error: HTTP ${error.status}.${error.body ? `\n${error.body}` : ''}`,
        true
      );
    }
    return textResult(error instanceof Error ? error.message : String(error), true);
  }
}

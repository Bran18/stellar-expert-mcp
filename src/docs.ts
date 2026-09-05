import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { OPENAPI_DOCS_URL } from './client.js';
import { ACCOUNT_ADDRESS, networkSchema } from './schemas.js';

const DOCS_TEXT = `StellarExpert Open API (v1.4.0)

Public, unauthenticated REST API. Base URL: https://api.stellar.expert
Docs: ${OPENAPI_DOCS_URL}

Groups:
- Directory API: well-known accounts, tags, blocked domains
- Asset Info API: list/search assets, rating, holders, holder rank, supply
- Ledger Info API: sequence <-> timestamp

Rate limits: HTTP 429. Cache or batch queries for heavy use.
This MCP wraps only the documented Open API, not undocumented explorer UI routes.
`;

export function registerDocsAndPrompts(server: McpServer): void {
  server.registerResource(
    'docs',
    'stellar-expert://docs',
    {
      title: 'StellarExpert Open API',
      description: 'Pointer and summary of the official StellarExpert Open API used by this MCP',
      mimeType: 'text/markdown'
    },
    async uri => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: `# StellarExpert Open API\n\nOfficial documentation: ${OPENAPI_DOCS_URL}\n\n${DOCS_TEXT}`
        }
      ]
    })
  );

  server.registerPrompt(
    'check-address-safety',
    {
      title: 'Check address safety',
      description:
        'Look up a Stellar account in the Directory and report malicious, unsafe, memo-required, and other tags.',
      argsSchema: z.object({
        address: ACCOUNT_ADDRESS
      })
    },
    ({ address }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Check Stellar account ${address} against the StellarExpert Directory.

1. Call get_directory_entry with this address.
2. If it is not listed, say it is not in the Directory — that is not a safety guarantee.
3. Summarize name, domain, and tags. Highlight malicious, unsafe, and memo-required.`
          }
        }
      ]
    })
  );

  server.registerPrompt(
    'lookup-asset',
    {
      title: 'Look up asset',
      description: 'Find an asset, then fetch rating and supply from StellarExpert.',
      argsSchema: z.object({
        query: z.string().describe('Asset code, issuer, domain, or CODE-ISSUER id'),
        network: networkSchema
      })
    },
    ({ query, network }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Look up Stellar asset "${query}" on network ${network ?? 'public (or STELLAR_EXPERT_NETWORK)'}.

1. Call list_assets with search="${query}" (and network if given).
2. Pick the best match and call get_asset_rating and get_asset_supply with its asset id.
3. Summarize domain, TOML metadata, rating breakdown, and supply.
4. State that rating is a technical popularity index, not financial advice.`
          }
        }
      ]
    })
  );
}

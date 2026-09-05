import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { expertGet, fromApi } from '../client.js';
import { ACCOUNT_ADDRESS, resultsLimit, sortOrder } from '../schemas.js';

export function registerDirectoryTools(server: McpServer): void {
  server.registerTool(
    'list_directory_entries',
    {
      title: 'List Directory entries',
      description:
        'Search the StellarExpert curated Directory of well-known accounts. Filter by address list, tags (exchange, anchor, issuer, wallet, custodian, malicious, unsafe, personal, sdf, memo-required, airdrop, defi), or a search string (name/domain/address, min 5 chars). Use for reverse lookups, scam checks (tag malicious/unsafe), and labeling counterparties.',
      inputSchema: z.object({
        address: z
          .array(ACCOUNT_ADDRESS)
          .min(1)
          .max(50)
          .optional()
          .describe('Filter by up to 50 account addresses'),
        tag: z
          .array(z.string().min(1))
          .min(1)
          .max(10)
          .optional()
          .describe('Filter by Directory tags, e.g. malicious, unsafe, memo-required'),
        search: z
          .string()
          .min(5)
          .optional()
          .describe('Full-text search by address, name, or domain (min 5 characters)'),
        cursor: ACCOUNT_ADDRESS.optional().describe('paging_token from a previous page to continue'),
        order: sortOrder,
        limit: resultsLimit
      })
    },
    async ({ address, tag, search, cursor, order, limit }) =>
      fromApi(() =>
        expertGet('/explorer/directory', {
          address,
          tag,
          search,
          cursor,
          order,
          limit
        })
      )
  );

  server.registerTool(
    'get_directory_entry',
    {
      title: 'Get Directory entry',
      description:
        'Look up one Stellar account in the Directory. Returns name, domain, and tags when listed. An empty object (or 404) means the account is not in the Directory — it may still exist on-chain.',
      inputSchema: z.object({
        address: ACCOUNT_ADDRESS
      })
    },
    async ({ address }) => fromApi(() => expertGet(`/explorer/directory/${encodeURIComponent(address)}`))
  );

  server.registerTool(
    'list_directory_tags',
    {
      title: 'List Directory tags',
      description:
        'List all Directory tag categories (name + description) used to classify well-known and reported accounts.',
      inputSchema: z.object({})
    },
    async () => fromApi(() => expertGet('/explorer/directory/tags'))
  );

  server.registerTool(
    'list_blocked_domains',
    {
      title: 'List blocked domains',
      description:
        'List domains reported for fraudulent Stellar-related activity. Paginated Horizon-style response. Prefer check_blocked_domain for a single hostname.',
      inputSchema: z.object({
        search: z
          .string()
          .min(2)
          .optional()
          .describe('Case-insensitive search by domain or substring (min 2 characters)'),
        cursor: z.string().optional().describe('paging_token from a previous page'),
        order: sortOrder,
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .describe('Page size (1–1000). Prefer a small limit for model context.')
      })
    },
    async ({ search, cursor, order, limit }) =>
      fromApi(() =>
        expertGet('/explorer/directory/blocked-domains', {
          search,
          cursor,
          order,
          limit: limit ?? 20
        })
      )
  );

  server.registerTool(
    'check_blocked_domain',
    {
      title: 'Check blocked domain',
      description:
        'Check whether a domain (or its registrable parent) is on the StellarExpert blocked-domains list. Use before linking or recommending a Stellar-related URL.',
      inputSchema: z.object({
        domain: z.string().min(1).describe('Hostname to verify, case-insensitive, e.g. sub.example.com')
      })
    },
    async ({ domain }) =>
      fromApi(() => expertGet(`/explorer/directory/blocked-domains/${encodeURIComponent(domain)}`))
  );
}

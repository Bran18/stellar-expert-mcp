import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { expertGet, fromApi, getDefaultNetwork } from '../client.js';
import { ACCOUNT_ADDRESS, assetId, networkSchema, resultsLimit, sortOrder } from '../schemas.js';

function networkPath(network?: 'public' | 'testnet'): string {
  return `/explorer/${network ?? getDefaultNetwork()}`;
}

export function registerAssetTools(server: McpServer): void {
  server.registerTool(
    'list_assets',
    {
      title: 'List assets',
      description:
        'List Stellar assets with on-chain stats and StellarExpert composite rating. Search by code, issuer, home domain, or stellar.toml metadata. Sort by rating (default), created, payments, trades, trustlines, volume, or volume7d. Use to find or rank assets; rating is technical (age, activity, liquidity, SEP metadata), not an investment recommendation.',
      inputSchema: z.object({
        network: networkSchema,
        search: z
          .string()
          .optional()
          .describe('Search by asset code, issuer, home domain, or TOML metadata'),
        sort: z
          .enum(['rating', 'created', 'payments', 'trades', 'trustlines', 'volume', 'volume7d'])
          .optional()
          .describe('Sort field. Defaults to rating.'),
        order: sortOrder,
        limit: resultsLimit,
        cursor: z.number().int().optional().describe('paging_token from a previous page')
      })
    },
    async ({ network, search, sort, order, limit, cursor }) =>
      fromApi(() =>
        expertGet(`${networkPath(network)}/asset`, {
          search,
          sort,
          order,
          limit,
          cursor
        })
      )
  );

  server.registerTool(
    'get_asset_rating',
    {
      title: 'Get asset rating',
      description:
        'Fetch StellarExpert composite technical rating for one asset (age, trades, payments, trustlines, volume7d, interoperability, liquidity, average). Ledger-activity based; not financial advice.',
      inputSchema: z.object({
        network: networkSchema,
        asset: assetId
      })
    },
    async ({ network, asset }) =>
      fromApi(() => expertGet(`${networkPath(network)}/asset/${encodeURIComponent(asset)}/rating`))
  );

  server.registerTool(
    'list_asset_holders',
    {
      title: 'List asset holders',
      description:
        'List accounts holding a non-zero balance of an asset, sorted by balance. Zero-balance trustlines are omitted. Horizon-style paging.',
      inputSchema: z.object({
        network: networkSchema,
        asset: assetId,
        order: sortOrder,
        limit: resultsLimit,
        cursor: z.string().optional().describe('paging_token from a previous page')
      })
    },
    async ({ network, asset, order, limit, cursor }) =>
      fromApi(() =>
        expertGet(`${networkPath(network)}/asset/${encodeURIComponent(asset)}/holders`, {
          order,
          limit,
          cursor
        })
      )
  );

  server.registerTool(
    'get_asset_holder_rank',
    {
      title: 'Get asset holder rank',
      description:
        'Get an account’s relative balance rank among holders of an asset (position and total holder count).',
      inputSchema: z.object({
        network: networkSchema,
        asset: assetId,
        account: ACCOUNT_ADDRESS
      })
    },
    async ({ network, asset, account }) =>
      fromApi(() =>
        expertGet(
          `${networkPath(network)}/asset/${encodeURIComponent(asset)}/position/${encodeURIComponent(account)}`
        )
      )
  );

  server.registerTool(
    'get_asset_supply',
    {
      title: 'Get asset supply',
      description:
        'Return total issued supply for an asset as plain text (useful for aggregators and dashboards). Native XLM and CODE-ISSUER identifiers are accepted.',
      inputSchema: z.object({
        network: networkSchema,
        asset: assetId
      })
    },
    async ({ network, asset }) =>
      fromApi(() => expertGet(`${networkPath(network)}/asset/${encodeURIComponent(asset)}/supply`))
  );
}

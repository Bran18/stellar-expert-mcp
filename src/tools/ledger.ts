import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { expertGet, fromApi, getDefaultNetwork } from '../client.js';
import { networkSchema } from '../schemas.js';

function networkPath(network?: 'public' | 'testnet'): string {
  return `/explorer/${network ?? getDefaultNetwork()}`;
}

export function registerLedgerTools(server: McpServer): void {
  server.registerTool(
    'ledger_sequence_from_timestamp',
    {
      title: 'Ledger sequence from timestamp',
      description:
        'Resolve the ledger sequence whose close time is equal to or before the given timestamp (UNIX seconds or RFC 3339). Returns 404 if the time is before the first ledger or in the future.',
      inputSchema: z.object({
        network: networkSchema,
        timestamp: z
          .union([z.string(), z.number()])
          .describe('UNIX time (seconds) or RFC 3339 timestamp, e.g. 1642597270 or 2022-08-29T13:51:18Z')
      })
    },
    async ({ network, timestamp }) =>
      fromApi(() =>
        expertGet(`${networkPath(network)}/ledger/sequence-from-timestamp`, {
          timestamp
        })
      )
  );

  server.registerTool(
    'ledger_timestamp_from_sequence',
    {
      title: 'Ledger timestamp from sequence',
      description: 'Resolve the close timestamp (UNIX + ISO date) for a given ledger sequence.',
      inputSchema: z.object({
        network: networkSchema,
        sequence: z.number().int().min(1).describe('Ledger sequence number')
      })
    },
    async ({ network, sequence }) =>
      fromApi(() =>
        expertGet(`${networkPath(network)}/ledger/timestamp-from-sequence`, {
          sequence
        })
      )
  );
}

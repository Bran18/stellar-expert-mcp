import { McpServer } from '@modelcontextprotocol/server';
import { VERSION } from './client.js';
import { registerDocsAndPrompts } from './docs.js';
import { registerAssetTools } from './tools/assets.js';
import { registerDirectoryTools } from './tools/directory.js';
import { registerLedgerTools } from './tools/ledger.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'stellar-expert',
    version: VERSION
  });

  registerDirectoryTools(server);
  registerAssetTools(server);
  registerLedgerTools(server);
  registerDocsAndPrompts(server);

  return server;
}

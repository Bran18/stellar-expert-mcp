import { createMcpHandler } from '@modelcontextprotocol/server';
import { ExpertApiError, expertGet, fromApi } from '../src/client.js';
import { createServer } from '../src/create-server.js';

const SDF_ESCROW = 'GA2VRL65L3ZFEDDJ357RGI3MAOKPJZ2Z3IJTPSC24I4KDTNFSVEQURRA';
const USDC = 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function checkLiveApi(): Promise<void> {
  const tags = await expertGet('/explorer/directory/tags');
  assert(Array.isArray(tags.json) && tags.json.length > 0, 'list tags failed');

  const entry = await expertGet(`/explorer/directory/${SDF_ESCROW}`);
  assert(entry.json && typeof entry.json === 'object', 'directory entry failed');

  const blocked = await expertGet('/explorer/directory/blocked-domains/stellar.org');
  assert(blocked.json && typeof blocked.json === 'object', 'check domain failed');

  const assets = await expertGet('/explorer/public/asset', { search: 'USDC', limit: 2 });
  assert(assets.json && typeof assets.json === 'object', 'list assets failed');

  const supply = await expertGet(`/explorer/public/asset/${encodeURIComponent(USDC)}/supply`);
  assert(supply.text.length > 0, 'asset supply empty');

  const ledger = await expertGet('/explorer/public/ledger/timestamp-from-sequence', {
    sequence: 42431435
  });
  assert(ledger.json && typeof ledger.json === 'object', 'ledger lookup failed');

  const missing = await fromApi(() =>
    expertGet('/explorer/public/asset/NOT-A-REAL-ASSET/rating')
  );
  assert(missing.isError === true, 'expected API error for invalid asset rating');

  const rateLimitShape = await fromApi(async () => {
    throw new ExpertApiError(429, 'HTTP 429');
  });
  assert(rateLimitShape.isError === true && rateLimitShape.content[0].text.includes('429'), '429 handling');

  console.error('live Open API checks passed');
}

async function parseMcpBody(res: Response): Promise<unknown> {
  const raw = await res.text();
  const dataLine = raw
    .split('\n')
    .find(line => line.startsWith('data: '));
  const payload = dataLine ? dataLine.slice(6) : raw;
  return JSON.parse(payload) as unknown;
}

async function checkMcpHandler(): Promise<void> {
  const handler = createMcpHandler(createServer);
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream'
  };

  const listRes = await handler.fetch(
    new Request('http://127.0.0.1/mcp', {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
    })
  );
  assert(listRes.ok, `tools/list HTTP ${listRes.status}`);
  const listed = (await parseMcpBody(listRes)) as { result?: { tools?: { name: string }[] } };
  const names = new Set((listed.result?.tools ?? []).map(tool => tool.name));
  for (const name of [
    'list_directory_tags',
    'get_directory_entry',
    'check_blocked_domain',
    'list_assets',
    'get_asset_supply',
    'ledger_timestamp_from_sequence'
  ]) {
    assert(names.has(name), `missing tool ${name}`);
  }

  const callRes = await handler.fetch(
    new Request('http://127.0.0.1/mcp', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'list_directory_tags', arguments: {} }
      })
    })
  );
  assert(callRes.ok, `tools/call HTTP ${callRes.status}`);
  const called = (await parseMcpBody(callRes)) as {
    result?: { isError?: boolean; content?: { text?: string }[] };
  };
  assert(!called.result?.isError, 'list_directory_tags returned isError');
  assert((called.result?.content?.[0]?.text ?? '').includes('exchange'), 'tags payload unexpected');

  await handler.close();
  console.error('in-process MCP handler checks passed');
}

try {
  await checkLiveApi();
  await checkMcpHandler();
} catch (error) {
  console.error(error);
  process.exit(1);
}

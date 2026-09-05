# StellarExpert MCP

Model Context Protocol server for the [StellarExpert Open API](https://stellar.expert/openapi) (v1.4.0). It exposes Directory, Asset Info, and Ledger helper endpoints as tools so Cursor, Claude, and other MCP hosts can query the same public data your product documents.

The Open API is public, unauthenticated, and CORS-enabled. This server only wraps **documented** Open API routes — not undocumented explorer UI endpoints.

Upstream: `https://api.stellar.expert`  
Docs: https://stellar.expert/openapi  
Data license on the Open API: MIT

## Tools

| Tool | Upstream |
|------|----------|
| `list_directory_entries` | `GET /explorer/directory` |
| `get_directory_entry` | `GET /explorer/directory/{address}` |
| `list_directory_tags` | `GET /explorer/directory/tags` |
| `list_blocked_domains` | `GET /explorer/directory/blocked-domains` |
| `check_blocked_domain` | `GET /explorer/directory/blocked-domains/{domain}` |
| `list_assets` | `GET /explorer/{network}/asset` |
| `get_asset_rating` | `GET /explorer/{network}/asset/{asset}/rating` |
| `list_asset_holders` | `GET /explorer/{network}/asset/{asset}/holders` |
| `get_asset_holder_rank` | `GET /explorer/{network}/asset/{asset}/position/{account}` |
| `get_asset_supply` | `GET /explorer/{network}/asset/{asset}/supply` |
| `ledger_sequence_from_timestamp` | `GET /explorer/{network}/ledger/sequence-from-timestamp` |
| `ledger_timestamp_from_sequence` | `GET /explorer/{network}/ledger/timestamp-from-sequence` |

Resource: `stellar-expert://docs`  
Prompts: `check-address-safety`, `lookup-asset`

`network` is `public` or `testnet` (default `public`, or `STELLAR_EXPERT_NETWORK`).

## Rate limits

StellarExpert may return **HTTP 429**. The MCP surfaces that as a tool error and asks the model to cache or batch queries. For heavy client usage, cache on your side.

Requests send `User-Agent: stellar-expert-mcp/0.1.0`.

## Requirements

- Node.js 20+

## Install (from a clone)

```sh
npm install
npm run build
```

### Local stdio (until published to npm)

Cursor — project `.cursor/mcp.json` or `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "stellar-expert": {
      "command": "npx",
      "args": ["tsx", "/ABS/PATH/TO/stellar-expert-mcp/src/stdio.ts"]
    }
  }
}
```

Or after `npm run build`:

```json
{
  "mcpServers": {
    "stellar-expert": {
      "command": "node",
      "args": ["/ABS/PATH/TO/stellar-expert-mcp/dist/stdio.js"]
    }
  }
}
```

### After npm publish

```json
{
  "mcpServers": {
    "stellar-expert": {
      "command": "npx",
      "args": ["-y", "stellar-expert-mcp"]
    }
  }
}
```

### Claude Desktop / Claude Code (stdio)

```json
{
  "mcpServers": {
    "stellar-expert": {
      "command": "npx",
      "args": ["tsx", "/ABS/PATH/TO/stellar-expert-mcp/src/stdio.ts"]
    }
  }
}
```

### MCP Inspector

```sh
npm run inspector
```

Equivalent: `npx @modelcontextprotocol/inspector npx tsx src/stdio.ts`

## Remote HTTP (clients)

Same `createServer()` factory over Streamable HTTP at `/mcp`.

```sh
npm run start:http
```

Defaults: `http://127.0.0.1:3000/mcp`. Health: `GET /health`.

| Env | Default | Purpose |
|-----|---------|---------|
| `PORT` | `3000` | Listen port |
| `HOST` | `127.0.0.1` | Bind address. Use `0.0.0.0` behind a reverse proxy |
| `ALLOWED_HOSTS` | (none) | Comma-separated Hostnames when binding non-localhost |
| `STELLAR_EXPERT_API_BASE` | `https://api.stellar.expert` | API origin |
| `STELLAR_EXPERT_NETWORK` | `public` | Default `network` for asset/ledger tools |

Cursor remote config:

```json
{
  "mcpServers": {
    "stellar-expert": {
      "url": "https://YOUR_HOST/mcp"
    }
  }
}
```

Smoke test:

```sh
curl -s -X POST http://127.0.0.1:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

This v1 ships a Node process (`npm run start:http`). Host it on Fly, a VM, or similar; do not bind `0.0.0.0` without `ALLOWED_HOSTS` / a proxy.

## Development

```sh
npm start          # stdio
npm run start:http
npm run typecheck
npm run verify     # live Open API + in-process MCP handler
```

## Attribution

API data and schema: [StellarExpert](https://stellar.expert). This MCP is a DevRel wrapper around the public Open API; it is not a substitute for on-chain source of truth (Horizon / RPC). Asset ratings are technical activity scores, not investment advice.

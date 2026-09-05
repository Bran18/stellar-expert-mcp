#!/usr/bin/env node
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createServer } from './create-server.js';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '127.0.0.1';
const allowedHosts = process.env.ALLOWED_HOSTS?.split(',')
  .map(value => value.trim())
  .filter(Boolean);

const handler = createMcpHandler(createServer);
const app = createMcpExpressApp({
  host: HOST,
  ...(allowedHosts?.length ? { allowedHosts } : {})
});
const node = toNodeHandler(handler);

app.all('/mcp', (req, res) => {
  void node(req, res, req.body);
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'stellar-expert-mcp' });
});

app.listen(PORT, HOST, () => {
  console.error(`stellar-expert-mcp HTTP listening on http://${HOST}:${PORT}/mcp`);
});

import * as z from 'zod/v4';

export const ACCOUNT_ADDRESS = z
  .string()
  .regex(/^G[ABCDEFGHIJKLMNOPQRSTUVWXYZ234567]{55}$/, 'Must be a Stellar G-address')
  .describe('Stellar account address (G followed by 55 base32 characters)');

export const networkSchema = z
  .enum(['public', 'testnet'])
  .optional()
  .describe('Stellar network. Defaults to STELLAR_EXPERT_NETWORK or public.');

export const sortOrder = z.enum(['asc', 'desc']).optional().describe('Results sort order');

export const resultsLimit = z
  .number()
  .int()
  .min(1)
  .max(200)
  .optional()
  .describe('Page size (1–200). Defaults to 10 on the API.');

export const assetId = z
  .string()
  .min(1)
  .describe(
    'Asset identifier: native XLM, or CODE-ISSUER (optionally with -1), e.g. USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
  );

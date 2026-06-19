# Intuition Fee Proxy — Affiliate webapp

![react](https://img.shields.io/badge/React-18-blue) ![vite](https://img.shields.io/badge/Vite-5-blue) ![typescript](https://img.shields.io/badge/TypeScript-5-blue) ![wagmi](https://img.shields.io/badge/wagmi%20v2-viem-orange) ![tailwind](https://img.shields.io/badge/Tailwind-3-orange) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

A web UI for the **Intuition FeeProxy singleton** — a multi-tenant fee layer in front of the [Intuition](https://intuition.systems) MultiVault. Any dApp builder registers once as an **affiliate**, sets a fee schedule, and points their app at their affiliate address; the proxy takes their fee on every routed deposit / atom creation, pushes it straight to their recipient, and forwards the rest to the MultiVault.

> The contract is Intuition's audited singleton (`0xIntuition/intuition-contracts-v2`, `src/periphery/FeeProxy.sol`). This repo is the **webapp** and works against its ABI — there is no Factory, no per-affiliate deployment, no fee pool, and no withdraw step. Fees are pushed at routing time.

## The model in one minute

- **One contract per network.** Everyone uses the same FeeProxy; there's nothing to deploy per affiliate.
- **Your wallet is your affiliate id.** `registerAffiliate(fees, feeRecipient)` keys one row by `msg.sender` (pays a small TRUST registration fee to the treasury).
- **Fees are push, instant.** On every `depositVia` / `createAtomsVia` the affiliate fee is sent to the recipient immediately — no accumulate/withdraw.
- **Fee schedule = `{ depositBps, creationBps, depositFixedFee, creationFixedFee }`**, capped by protocol-level `maxBps` / `maxFixedFee`. The app lets you enter the bps as a human percentage.
- **Metrics are on-chain & free.** `affiliateStats` (txCount, unique users, volume, fees, deposit/creation split) — read directly, no indexer.

## What the webapp does

| Page | Purpose |
|---|---|
| **Home** | Pitch + live network stats (affiliates, funds routed, fees, txs) |
| **Register** | Become an affiliate: set fees (%) + recipient, pay the registration fee |
| **My affiliate** | Your dashboard — `Analytics` (stats + activity feed via event `getLogs`), `Integration` (copy-paste `depositVia` snippet + your id), `Config` (edit fees / recipient) |
| **Affiliates** | Directory of every registered affiliate (from `AffiliateRegistered` logs) |
| **Affiliate detail** | Public read-only view of any affiliate |
| **Docs** | Concepts + a one-click **"Copy full guide for an AI agent"** to scaffold a dApp integration |

## Live deployment

- **Network:** Intuition testnet (chain `13579`, RPC `https://testnet.rpc.intuition.systems`)
- **FeeProxy singleton:** `0x667cD4eC689dC06dDBCf6BE19d5F0bb2a6c7c792`

The app reads addresses from `packages/webapp/src/contracts/` and accepts a per-machine override via `.env.local` (below).

## Structure

```
intuition-fee-proxy-template/
├── packages/
│   ├── webapp/      # Vite + React UI (the product) — pages above, vendored ABI in src/contracts/
│   ├── sdk/         # Legacy shared ABIs/readers (factory era) — webapp is decoupled; reintegrated later
│   └── safe-tx/     # Legacy Safe tooling (factory era)
└── .claude/         # Project context, decisions, rules (see .claude/README.md)
```

## Install & run

Requires [Bun](https://bun.sh).

```bash
bun install
bun run webapp:dev        # http://localhost:5173
bun run webapp:build      # production build
bun run webapp:preview     # preview the build
# typecheck just the webapp:
bun --filter @intuition-fee-proxy/webapp typecheck
```

## Configuration

Point the webapp at a deployed FeeProxy via a gitignored `packages/webapp/.env.local`:

```bash
VITE_FEEPROXY_ADDRESS=0x667cD4eC689dC06dDBCf6BE19d5F0bb2a6c7c792
VITE_MULTIVAULT_ADDRESS=0x2Ece8D4dEdcB9918A398528f3fa4688b1d2CAB91
```

Without it, the app reads the per-network defaults in `src/contracts/addresses.ts` and degrades gracefully to a "not configured" state when the address is unset.

## Status

- ✅ Affiliate surface (register, edit fees/recipient, stats, dashboard, docs) — live against the testnet FeeProxy.
- ⏳ **End-to-end fee routing** (`depositVia` / `createAtomsVia`) needs the MultiVault on-behalf-of surface (`isApprovedToDeposit/Create`, `createAtomsFor`). The current testnet MultiVault predates it, so routing reverts until Intuition deploys the patched MultiVault on testnet. The FeeProxy and the webapp are ready; nothing to recode.
- The end-user deposit flow and approval revocation are a deferred side quest (one `MultiVault.approve(feeProxy, NONE)` call, already supported).

## Project context

The [.claude/](./.claude/) directory holds the planning, architecture decisions, and rules — see [.claude/README.md](./.claude/README.md). The legacy Factory/V2 history is preserved on the `v2-upgradeable-factory` branch and the `factory-final` tag.

## License

MIT

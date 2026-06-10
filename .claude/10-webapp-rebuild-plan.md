# Webapp rebuild plan — affiliate-facing UI on the FeeProxy singleton

> Status: in progress (branch `feat/webapp-affiliate-singleton`). Target contract =
> Intuition's audited singleton, see [06-tech-decisions.md](./06-tech-decisions.md) and
> [01-current-state.md](./01-current-state.md) for the ENG-11832 pivot.

## Context

The user now owns ONLY the webapp (not SDK, not Solidity). The project is no longer a
Factory — it targets Intuition's **deployed singleton multi-tenant FeeProxy**
(`0xIntuition/intuition-contracts-v2@feat/v1.1.0-core-upgrade`,
`src/periphery/FeeProxy.sol` + `src/interfaces/IFeeProxy.sol`, Solidity 0.8.29). The
webapp works against the **ABI only**; the SDK is reintegrated later.

The webapp is NOT greenfield — it is ~70% on the affiliate model already, but in a
transitional state: coupled to the local SDK and weighed down by out-of-scope Safe /
admin / sponsored / versions baggage.

## Mental model (one machine, one tag per affiliate)

- ONE FeeProxy contract per network, deployed and admin-owned by Intuition. Everyone
  calls the same address.
- An "affiliate" registers with their own wallet (`registerAffiliate`). That wallet
  address IS their identity / routing tag (like an Amazon Associates `?tag=`).
- A dApp routes fees by calling `depositVia(affiliate, ...)` on the singleton, passing
  the affiliate's wallet as the `affiliate` argument. Fees are PUSHED instantly to the
  affiliate's `feeRecipient` (no accumulate/withdraw).
- We monitor per affiliate via on-chain stats + events keyed on the indexed `affiliate`.

## Confirmed cuts (validated by user 2026-06-10)

- ❌ **Admin page + role hooks** — admin is Intuition's role, not the user's.
- ❌ **Safe integration** (`safe-tx` package, all Safe components/hooks) — out of scope.
- ❌ **Local SDK coupling** — vendor the ABI/addresses/chains/types into the webapp;
  SDK reintegrated later.
- ❌ **End-user deposit flow** (`depositVia` + MultiVault approval) — deferred side
  quest. Revocation later = a single `MultiVault.approve(feeProxy, NONE)` call, already
  supported, zero contract change.

## Front-end surface review (the contract-freeze-window question)

NO FeeProxy change needed for the webapp. Views + events fully cover the vision. The two
non-gaps (enumerate affiliates / enumerate interacting wallets) are deliberately
event-indexed (`getLogs` on affiliate-indexed topics) — on-chain enumerable arrays would
hurt the audit. Caps / registrationFee are admin-settable post-deploy, not frozen.

## Phases (each phase = a coherent set of traceable commits)

Branch: `feat/webapp-affiliate-singleton` off `feat/singleton-feeproxy`. Conventional
commits (`feat(webapp)/refactor(webapp)/chore/docs`). Each commit must typecheck.

### Phase 0 — Foundations (vendor + decouple)
- `src/contracts/` vendored module: `feeProxyAbi.ts` (copy of the audited `parseAbi`
  block), `chains.ts`, `addresses.ts`, `types.ts`, `index.ts` barrel.
- Repoint kept files from `@intuition-fee-proxy/sdk` → `../contracts`.
- MultiVault ABI is NOT vendored now (only the deleted dead atom hook used it; the
  deferred end-user flow will add an `approve`/`isApproved` subset when built).

### Phase 1 — Prune (remove out-of-scope)
- Delete: `pages/Admin.tsx` (+ route + nav link), `hooks/useProtocolAdmin.ts`,
  `useProxyRoles.ts`, all Safe hooks/components (`usePendingSafeTxs`, `useSafePropose`,
  `useSafeAdmin`, `useSafeStatus`, `PendingSafeTxsPanel`, `ProxyAdminSafeBanner`,
  `SafeBadge`, `SafeProposeFeedback`, `lib/safeDetection.ts`), and the dead
  `hooks/useIntuitionAtom.ts` (Factory leftover, no live import).
- Remove `@intuition-fee-proxy/sdk` + `@intuition-fee-proxy/safe-tx` from
  `package.json`.

### Phase 2 — Realign hooks on the vendored ABI
- Point affiliate hooks at `src/contracts`. Add `useAffiliateUserStats`, `useFeePreview`
  (preview deposit/creation), `useAffiliateStatus` (registered/active).

### Phase 3 — Register page
- Form: `depositBps`, `depositFixedFee`, `creationBps`, `creationFixedFee` +
  `feeRecipient`. Shows live `registrationFee` + caps. `registerAffiliate` payable with
  signing→mining→success states and an "already registered" guard.

### Phase 4 — My affiliate / Dashboard (core)
- Editable config block (`updateAffiliateFees`, `updateFeeRecipient`, paused badge).
- Metrics from `affiliateStats` (volume, fees earned, txCount, uniqueUsers, deposit vs
  creation split).
- **Integration kit** section: singleton address + the affiliate's own address + a
  copy-paste `depositVia`/`createAtomsVia` snippet (this is what makes registration
  usable — the affiliate pastes it into their dApp).
- Activity feed via `getLogs` on the affiliate-indexed routing events, enriched per
  wallet with `affiliateUserStats`.

### Phase 5 — Affiliates / AffiliateDetail (explore)
- List via `AffiliateRegistered` getLogs. Public read-only detail per address.

### Phase 6 — Home + Docs + polish
- Simplify Home for the singleton affiliate model (drop factory/deploy framing, possibly
  drop the `LaserFlow`/three effect). Rewrite Docs (drop factory/sponsoring/versions).
  Design pass: warm-paper + burnt-orange + Geist, no emojis.

### Phase 7 — Verify & PR
- `bun typecheck` + `bun webapp:build` green. Manual test against `.env.local` pointing a
  testnet/fork deploy. Open PR with the cut summary.

## Wiring reference (ABI per page)

| Page | Reads | Writes | Events |
|---|---|---|---|
| Register | `registrationFee`, `maxBps`, `maxFixedFee`, `isAffiliateRegistered` | `registerAffiliate` | `AffiliateRegistered` |
| My affiliate | `affiliateConfig`, `affiliateStats`, `affiliateUserStats` | `updateAffiliateFees`, `updateFeeRecipient` | `DepositedVia`, `CreatedAtomsVia`, `CreatedTriplesVia`, `DepositedBatchVia`, `AffiliateFeeAccrued` |
| Affiliates | (events) | — | `AffiliateRegistered` |
| Affiliate detail | `affiliateConfig`, `affiliateStats` | — | routing events (filtered) |

## Notes
- The user runs all `bun` commands; never run `bun` from the agent — give the exact
  command for them to paste output.
- `chown max:max` after any root-owned write batch; `chown -R max:max .git` after commits.

import { useState } from 'react'
import { isAddress, parseEther, type Address } from 'viem'
import { useAccount } from 'wagmi'

import type { AdminOp } from '@intuition-fee-proxy/safe-tx'

import { useFeeProxyAddress } from '../hooks/useFeeProxyAddress'
import { useProtocolConfig } from '../hooks/useProtocolConfig'
import { useFeeProxyRoles } from '../hooks/useProxyRoles'
import { useSafeAdmin } from '../hooks/useSafeAdmin'
import { useSafePropose } from '../hooks/useSafePropose'
import { useProtocolAdmin, type AdminAction, type RoleName } from '../hooks/useProtocolAdmin'
import { Stat } from '../components/Stat'
import { Spinner } from '../components/Spinner'
import { ProxyAdminSafeBanner } from '../components/ProxyAdminSafeBanner'
import { SafeProposeFeedback } from '../components/SafeProposeFeedback'
import { PendingSafeTxsPanel } from '../components/PendingSafeTxsPanel'
import { formatBps, formatTrust } from '../lib/format'

export default function AdminPage() {
  const { address } = useAccount()
  const { configured } = useFeeProxyAddress()
  const { config, isLoading } = useProtocolConfig()
  const roles = useFeeProxyRoles(address)
  const { safe, isSafe } = useSafeAdmin(address)
  const propose = useSafePropose({ safeAddress: safe })
  const admin = useProtocolAdmin()

  // Dispatch a single admin action: propose via Safe when the admin is a Safe,
  // otherwise send a direct EOA tx.
  async function dispatch(action: AdminAction) {
    if (isSafe) {
      const op: AdminOp = admin.buildOp(action)
      await propose.propose(op)
    } else {
      await admin.writeDirect(action)
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <header className="space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-wider text-brand">
          Protocol
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Admin</h1>
        <p className="text-sm text-muted leading-relaxed">
          Global protocol configuration and roles for the FeeProxy singleton.
        </p>
      </header>

      {!configured && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-300">
          The FeeProxy singleton is not configured on this network yet.
        </div>
      )}

      {/* Protocol config (public) */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-ink">Protocol config</h2>
          {config?.paused && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 border border-rose-400/40 rounded px-1.5 py-0.5">
              Globally paused
            </span>
          )}
          {isLoading && <Spinner />}
        </div>
        {config && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="MultiVault" value={config.multiVault} mono />
            <Stat label="Treasury" value={config.treasury} mono />
            <Stat label="Max bps" value={`${config.maxBps.toString()} (${formatBps(config.maxBps)})`} />
            <Stat label="Max fixed fee" value={`${formatTrust(config.maxFixedFee)} TRUST`} />
            <Stat label="Registration fee" value={`${formatTrust(config.registrationFee)} TRUST`} />
            <Stat label="Global paused" value={config.paused ? 'yes' : 'no'} />
          </div>
        )}
      </section>

      {!address && (
        <p className="text-sm text-muted">Connect a wallet to manage the protocol.</p>
      )}

      {address && configured && !roles.hasAnyRole && !roles.isLoading && (
        <div className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
          The connected wallet holds neither DEFAULT_ADMIN_ROLE nor PAUSER_ROLE.
          Management actions are hidden.
        </div>
      )}

      {address && configured && roles.hasAnyRole && (
        <>
          <ProxyAdminSafeBanner admin={address} />
          <SafeProposeFeedback proposed={propose.proposed} error={propose.error} />

          <ManagementPanels
            roles={roles}
            isSafe={isSafe}
            dispatch={dispatch}
            isBusy={admin.isPending || propose.isProposing}
            directError={admin.error?.message ?? null}
          />

          {safe && <PendingSafeTxsPanel safe={safe} />}
        </>
      )}
    </div>
  )
}

interface PanelProps {
  roles: { isAdmin: boolean; isPauser: boolean }
  isSafe: boolean
  dispatch: (a: AdminAction) => Promise<void>
  isBusy: boolean
  directError: string | null
}

function ManagementPanels({ roles, isSafe, dispatch, isBusy, directError }: PanelProps) {
  const verb = isSafe ? 'Propose' : 'Submit'
  return (
    <div className="space-y-6">
      {directError && (
        <p className="text-xs text-rose-400 font-mono">{directError.split('\n')[0]}</p>
      )}

      {roles.isAdmin && (
        <CapsPanel dispatch={dispatch} isBusy={isBusy} verb={verb} />
      )}

      <PausePanel
        roles={roles}
        dispatch={dispatch}
        isBusy={isBusy}
        verb={verb}
      />

      {roles.isAdmin && <RolesPanel dispatch={dispatch} isBusy={isBusy} verb={verb} />}
    </div>
  )
}

function CapsPanel({
  dispatch,
  isBusy,
  verb,
}: {
  dispatch: (a: AdminAction) => Promise<void>
  isBusy: boolean
  verb: string
}) {
  const [maxBps, setMaxBps] = useState('')
  const [maxFixed, setMaxFixed] = useState('')
  const [regFee, setRegFee] = useState('')

  return (
    <section className="card space-y-5">
      <h3 className="text-sm font-semibold text-ink">Caps & registration fee</h3>
      <SingleValueRow
        label="Max bps"
        placeholder="e.g. 1000"
        value={maxBps}
        onChange={setMaxBps}
        verb={verb}
        disabled={isBusy || !maxBps}
        onSubmit={() => dispatch({ kind: 'setMaxBps', value: BigInt(maxBps || '0') })}
      />
      <SingleValueRow
        label="Max fixed fee (TRUST)"
        placeholder="e.g. 0.5"
        value={maxFixed}
        onChange={setMaxFixed}
        verb={verb}
        disabled={isBusy || !maxFixed}
        onSubmit={() => dispatch({ kind: 'setMaxFixedFee', value: parseEther(maxFixed || '0') })}
      />
      <SingleValueRow
        label="Registration fee (TRUST)"
        placeholder="e.g. 1"
        value={regFee}
        onChange={setRegFee}
        verb={verb}
        disabled={isBusy || !regFee}
        onSubmit={() => dispatch({ kind: 'setRegistrationFee', value: parseEther(regFee || '0') })}
      />
    </section>
  )
}

function PausePanel({
  roles,
  dispatch,
  isBusy,
  verb,
}: {
  roles: { isAdmin: boolean; isPauser: boolean }
  dispatch: (a: AdminAction) => Promise<void>
  isBusy: boolean
  verb: string
}) {
  const [affiliate, setAffiliate] = useState('')
  const affValid = isAddress(affiliate)

  return (
    <section className="card space-y-5">
      <h3 className="text-sm font-semibold text-ink">Pause controls</h3>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => dispatch({ kind: 'pause' })}
          className="btn-secondary px-4 py-2 disabled:opacity-50"
        >
          {verb} global pause
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => dispatch({ kind: 'unpause' })}
          className="btn-secondary px-4 py-2 disabled:opacity-50"
        >
          {verb} global unpause
        </button>
      </div>

      <div className="space-y-2">
        <label className="block space-y-1.5">
          <span className="text-xs text-subtle">Affiliate address</span>
          <input
            className="input font-mono"
            placeholder="0x…"
            value={affiliate}
            onChange={(e) => setAffiliate(e.target.value)}
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isBusy || !affValid}
            onClick={() => dispatch({ kind: 'pauseAffiliate', affiliate: affiliate as Address })}
            className="btn-secondary px-4 py-2 disabled:opacity-50"
          >
            {verb} pause affiliate
          </button>
          <button
            type="button"
            disabled={isBusy || !affValid || !roles.isAdmin}
            onClick={() => dispatch({ kind: 'unpauseAffiliate', affiliate: affiliate as Address })}
            className="btn-secondary px-4 py-2 disabled:opacity-50"
            title={roles.isAdmin ? undefined : 'Unpause requires DEFAULT_ADMIN_ROLE'}
          >
            {verb} unpause affiliate
          </button>
        </div>
      </div>
    </section>
  )
}

function RolesPanel({
  dispatch,
  isBusy,
  verb,
}: {
  dispatch: (a: AdminAction) => Promise<void>
  isBusy: boolean
  verb: string
}) {
  const [role, setRole] = useState<RoleName>('pauser')
  const [account, setAccount] = useState('')
  const valid = isAddress(account)

  return (
    <section className="card space-y-4">
      <h3 className="text-sm font-semibold text-ink">Roles</h3>
      <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
        <label className="block space-y-1.5">
          <span className="text-xs text-subtle">Role</span>
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as RoleName)}
          >
            <option value="admin">admin</option>
            <option value="pauser">pauser</option>
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-subtle">Account</span>
          <input
            className="input font-mono"
            placeholder="0x…"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isBusy || !valid}
          onClick={() => dispatch({ kind: 'grantRole', role, account: account as Address })}
          className="btn-secondary px-4 py-2 disabled:opacity-50"
        >
          {verb} grant
        </button>
        <button
          type="button"
          disabled={isBusy || !valid}
          onClick={() => dispatch({ kind: 'revokeRole', role, account: account as Address })}
          className="btn-secondary px-4 py-2 disabled:opacity-50"
        >
          {verb} revoke
        </button>
      </div>
    </section>
  )
}

function SingleValueRow({
  label,
  placeholder,
  value,
  onChange,
  verb,
  disabled,
  onSubmit,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  verb: string
  disabled: boolean
  onSubmit: () => void
}) {
  return (
    <div className="flex items-end gap-3">
      <label className="block space-y-1.5 flex-1">
        <span className="text-xs text-subtle">{label}</span>
        <input
          className="input font-mono"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
        />
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={onSubmit}
        className="btn-secondary px-4 py-2 disabled:opacity-50 shrink-0"
      >
        {verb}
      </button>
    </div>
  )
}
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Address } from 'viem'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'

import type { FeeConfig } from '@intuition-fee-proxy/sdk'

import { useProtocolConfig } from '../hooks/useProtocolConfig'
import { useAffiliate } from '../hooks/useAffiliate'
import { useRegisterAffiliate } from '../hooks/useAffiliateWrites'
import { FeeConfigFields, parseFeeFields, type FeeFields } from '../components/FeeConfigFields'
import { Spinner } from '../components/Spinner'
import { formatTrust } from '../lib/format'

const EMPTY: FeeFields = {
  depositBps: '0',
  creationBps: '0',
  depositFixedFee: '0',
  creationFixedFee: '0',
}

export default function RegisterPage() {
  const { address } = useAccount()
  const { config, configured, isLoading: cfgLoading } = useProtocolConfig()
  const { registered, isLoading: meLoading } = useAffiliate(address)
  const { register, hash, isPending, error, canWrite } = useRegisterAffiliate()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [fields, setFields] = useState<FeeFields>(EMPTY)
  const [recipient, setRecipient] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)

  const effectiveRecipient = (recipient || address || '') as string

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!config) return
    let fees: FeeConfig
    try {
      fees = parseFeeFields(fields)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Invalid fee values')
      return
    }
    if (fees.depositBps > config.maxBps || fees.creationBps > config.maxBps) {
      setFormError(`bps exceed the cap of ${config.maxBps.toString()}`)
      return
    }
    if (
      fees.depositFixedFee > config.maxFixedFee ||
      fees.creationFixedFee > config.maxFixedFee
    ) {
      setFormError('fixed fee exceeds the cap')
      return
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(effectiveRecipient)) {
      setFormError('Enter a valid fee recipient address')
      return
    }
    try {
      await register(fees, effectiveRecipient as Address, config.registrationFee)
    } catch (err) {
      setFormError(err instanceof Error ? err.message.split('\n')[0] : String(err))
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <header className="space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-wider text-brand">
          Affiliate
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Register as an affiliate
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          Set your fee schedule and recipient. Registration sends exactly the
          current registration fee in TRUST, forwarded to the protocol treasury.
          Your wallet keys a single affiliate row.
        </p>
      </header>

      {!configured && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-300">
          The FeeProxy singleton is not configured on this network yet.
          Registration is disabled.
        </div>
      )}

      {registered && (
        <div className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
          This wallet is already a registered affiliate.{' '}
          <Link to="/me" className="text-brand underline decoration-brand/60 hover:decoration-brand">
            Manage your affiliate →
          </Link>
        </div>
      )}

      {isSuccess && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-300">
          Registered. <Link to="/me" className="underline">Go to your affiliate →</Link>
        </div>
      )}

      <form onSubmit={onSubmit} className="card space-y-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">
            Registration fee
          </div>
          <div className="text-lg font-semibold text-ink">
            {cfgLoading ? (
              <Spinner ariaLabel="Loading" />
            ) : config ? (
              `${formatTrust(config.registrationFee)} TRUST`
            ) : (
              '—'
            )}
          </div>
        </div>

        <FeeConfigFields
          fields={fields}
          onChange={setFields}
          maxBps={config?.maxBps}
          maxFixedFee={config?.maxFixedFee}
        />

        <label className="block space-y-1.5">
          <span className="text-xs text-subtle">Fee recipient</span>
          <input
            className="input font-mono"
            placeholder={address ?? '0x…'}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <span className="text-[11px] text-subtle">
            Defaults to the connected wallet when left blank.
          </span>
        </label>

        {formError && (
          <p className="text-xs text-rose-400 font-mono">{formError}</p>
        )}
        {error && !formError && (
          <p className="text-xs text-rose-400 font-mono">
            {error.message.split('\n')[0]}
          </p>
        )}

        <button
          type="submit"
          disabled={
            !canWrite || registered || !address || isPending || confirming || meLoading
          }
          className="btn-primary px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending || confirming ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Registering…
            </span>
          ) : (
            'Register affiliate'
          )}
        </button>
        {!address && (
          <span className="ml-3 text-xs text-subtle">Connect a wallet first.</span>
        )}
      </form>
    </div>
  )
}

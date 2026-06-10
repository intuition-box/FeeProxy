import { useState } from 'react'
import type { Address } from 'viem'
import { useWaitForTransactionReceipt } from 'wagmi'

import type { AffiliateConfig, FeeConfig } from '@intuition-fee-proxy/sdk'

import { useProtocolConfig } from '../hooks/useProtocolConfig'
import { useUpdateAffiliateFees, useUpdateFeeRecipient } from '../hooks/useAffiliateWrites'
import { FeeConfigFields, feeFieldsFrom, parseFeeFields, type FeeFields } from './FeeConfigFields'
import { Spinner } from './Spinner'

/**
 * Management panels for the connected affiliate's own row: update fees and
 * update fee recipient. Both call the singleton directly (affiliate = msg.sender).
 */
export function ManageAffiliate({
  config,
  onUpdated,
}: {
  config: AffiliateConfig
  onUpdated?: () => void
}) {
  return (
    <section className="space-y-6">
      <h2 className="font-semibold text-ink">Manage</h2>
      <UpdateFeesPanel config={config} onUpdated={onUpdated} />
      <UpdateRecipientPanel config={config} onUpdated={onUpdated} />
    </section>
  )
}

function UpdateFeesPanel({
  config,
  onUpdated,
}: {
  config: AffiliateConfig
  onUpdated?: () => void
}) {
  const { config: protocol } = useProtocolConfig()
  const { update, hash, isPending, error, canWrite } = useUpdateAffiliateFees()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [fields, setFields] = useState<FeeFields>(() => feeFieldsFrom(config.fees))
  const [formError, setFormError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    let fees: FeeConfig
    try {
      fees = parseFeeFields(fields)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Invalid fee values')
      return
    }
    if (protocol) {
      if (fees.depositBps > protocol.maxBps || fees.creationBps > protocol.maxBps) {
        setFormError(`bps exceed the cap of ${protocol.maxBps.toString()}`)
        return
      }
      if (
        fees.depositFixedFee > protocol.maxFixedFee ||
        fees.creationFixedFee > protocol.maxFixedFee
      ) {
        setFormError('fixed fee exceeds the cap')
        return
      }
    }
    try {
      await update(fees)
      onUpdated?.()
    } catch (err) {
      setFormError(err instanceof Error ? err.message.split('\n')[0] : String(err))
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <h3 className="text-sm font-semibold text-ink">Update fees</h3>
      <FeeConfigFields
        fields={fields}
        onChange={setFields}
        maxBps={protocol?.maxBps}
        maxFixedFee={protocol?.maxFixedFee}
      />
      {formError && <p className="text-xs text-rose-400 font-mono">{formError}</p>}
      {error && !formError && (
        <p className="text-xs text-rose-400 font-mono">{error.message.split('\n')[0]}</p>
      )}
      {isSuccess && <p className="text-xs text-emerald-400">Fees updated.</p>}
      <button
        type="submit"
        disabled={!canWrite || isPending || confirming}
        className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending || confirming ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Updating…
          </span>
        ) : (
          'Update fees'
        )}
      </button>
    </form>
  )
}

function UpdateRecipientPanel({
  config,
  onUpdated,
}: {
  config: AffiliateConfig
  onUpdated?: () => void
}) {
  const { update, hash, isPending, error, canWrite } = useUpdateFeeRecipient()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [recipient, setRecipient] = useState<string>(config.feeRecipient)
  const [formError, setFormError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) {
      setFormError('Enter a valid address')
      return
    }
    try {
      await update(recipient as Address)
      onUpdated?.()
    } catch (err) {
      setFormError(err instanceof Error ? err.message.split('\n')[0] : String(err))
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <h3 className="text-sm font-semibold text-ink">Update fee recipient</h3>
      <label className="block space-y-1.5">
        <span className="text-xs text-subtle">New recipient</span>
        <input
          className="input font-mono"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </label>
      {formError && <p className="text-xs text-rose-400 font-mono">{formError}</p>}
      {error && !formError && (
        <p className="text-xs text-rose-400 font-mono">{error.message.split('\n')[0]}</p>
      )}
      {isSuccess && <p className="text-xs text-emerald-400">Recipient updated.</p>}
      <button
        type="submit"
        disabled={!canWrite || isPending || confirming}
        className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending || confirming ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Updating…
          </span>
        ) : (
          'Update recipient'
        )}
      </button>
    </form>
  )
}

import { parseEther } from 'viem'
import type { FeeConfig } from '../contracts'
import { formatBps, formatTrust } from '../lib/format'

export type FeeFields = {
  depositBps: string
  creationBps: string
  /** Fixed fees entered as a decimal TRUST amount (converted to wei). */
  depositFixedFee: string
  creationFixedFee: string
}

/** Parse the string form fields into an on-chain `FeeConfig` (bigints). */
export function parseFeeFields(f: FeeFields): FeeConfig {
  const depositBps = BigInt(f.depositBps || '0')
  const creationBps = BigInt(f.creationBps || '0')
  const depositFixedFee = parseEther((f.depositFixedFee || '0').trim())
  const creationFixedFee = parseEther((f.creationFixedFee || '0').trim())
  return { depositBps, creationBps, depositFixedFee, creationFixedFee }
}

/** Build editable string fields from an on-chain `FeeConfig`. */
export function feeFieldsFrom(fees: FeeConfig): FeeFields {
  return {
    depositBps: fees.depositBps.toString(),
    creationBps: fees.creationBps.toString(),
    depositFixedFee: formatTrust(fees.depositFixedFee),
    creationFixedFee: formatTrust(fees.creationFixedFee),
  }
}

interface Props {
  fields: FeeFields
  onChange: (next: FeeFields) => void
  maxBps?: bigint
  maxFixedFee?: bigint
}

/**
 * Shared fee-schedule editor used by registration and fee-update flows.
 * bps are integers (base 10000); fixed fees are entered in TRUST.
 */
export function FeeConfigFields({ fields, onChange, maxBps, maxFixedFee }: Props) {
  const set = (key: keyof FeeFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...fields, [key]: e.target.value })

  const capHint =
    maxBps !== undefined
      ? `Caps: max ${maxBps.toString()} bps (${formatBps(maxBps)})${
          maxFixedFee !== undefined ? `, max ${formatTrust(maxFixedFee)} TRUST fixed` : ''
        }`
      : null

  return (
    <div className="space-y-4">
      <div className="text-xs text-subtle">Fee schedule{capHint ? ` — ${capHint}` : ''}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Deposit bps"
          hint="base 10000"
          value={fields.depositBps}
          onChange={set('depositBps')}
          mono
        />
        <Field
          label="Creation bps"
          hint="base 10000"
          value={fields.creationBps}
          onChange={set('creationBps')}
          mono
        />
        <Field
          label="Deposit fixed fee (TRUST)"
          value={fields.depositFixedFee}
          onChange={set('depositFixedFee')}
          mono
        />
        <Field
          label="Creation fixed fee (TRUST)"
          value={fields.creationFixedFee}
          onChange={set('creationFixedFee')}
          mono
        />
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  value,
  onChange,
  mono,
}: {
  label: string
  hint?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  mono?: boolean
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-subtle">{label}</span>
      <input
        className={`input ${mono ? 'font-mono' : ''}`}
        value={value}
        onChange={onChange}
        inputMode="decimal"
      />
      {hint && <span className="text-[11px] text-subtle">{hint}</span>}
    </label>
  )
}

import { parseEther } from 'viem'
import type { FeeConfig } from '../contracts'
import { formatBps, formatTrust } from '../lib/format'

export type FeeFields = {
  /** Percentage fees entered as a human percent (e.g. "1.5" = 1.5%). */
  depositPct: string
  creationPct: string
  /** Fixed fees entered as a decimal TRUST amount (converted to wei). */
  depositFixedFee: string
  creationFixedFee: string
}

/**
 * Convert a human percentage string to on-chain bps (basis points, base 10000).
 * "1" → 100, "2.5" → 250, "0.05" → 5. Max 2 decimals (1 bps = 0.01%).
 */
function pctToBps(pct: string): bigint {
  const t = (pct || '0').trim()
  if (!/^\d+(\.\d{1,2})?$/.test(t)) {
    throw new Error(`Invalid percentage "${pct}" — use up to 2 decimals (e.g. 1.5)`)
  }
  return BigInt(Math.round(parseFloat(t) * 100))
}

/** Convert on-chain bps to a clean percentage string. 250 → "2.5", 5 → "0.05". */
function bpsToPct(bps: bigint): string {
  const whole = bps / 100n
  const frac = bps % 100n
  if (frac === 0n) return whole.toString()
  const fracStr = frac.toString().padStart(2, '0').replace(/0$/, '')
  return `${whole}.${fracStr}`
}

/** Parse the string form fields into an on-chain `FeeConfig` (bigints). */
export function parseFeeFields(f: FeeFields): FeeConfig {
  const depositBps = pctToBps(f.depositPct)
  const creationBps = pctToBps(f.creationPct)
  const depositFixedFee = parseEther((f.depositFixedFee || '0').trim())
  const creationFixedFee = parseEther((f.creationFixedFee || '0').trim())
  return { depositBps, creationBps, depositFixedFee, creationFixedFee }
}

/** Build editable string fields from an on-chain `FeeConfig`. */
export function feeFieldsFrom(fees: FeeConfig): FeeFields {
  return {
    depositPct: bpsToPct(fees.depositBps),
    creationPct: bpsToPct(fees.creationBps),
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
 * Percentages are entered as human percents and converted to bps on submit;
 * fixed fees are entered in TRUST.
 */
export function FeeConfigFields({ fields, onChange, maxBps, maxFixedFee }: Props) {
  const set = (key: keyof FeeFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...fields, [key]: e.target.value })

  const capHint =
    maxBps !== undefined
      ? `Caps: max ${formatBps(maxBps)}${
          maxFixedFee !== undefined ? `, max ${formatTrust(maxFixedFee)} TRUST fixed` : ''
        }`
      : null

  return (
    <div className="space-y-4">
      <div className="text-xs text-subtle">Fee schedule{capHint ? ` — ${capHint}` : ''}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Deposit fee (%)"
          hint="e.g. 1.5 for 1.5%"
          value={fields.depositPct}
          onChange={set('depositPct')}
          mono
        />
        <Field
          label="Creation fee (%)"
          hint="e.g. 1.5 for 1.5%"
          value={fields.creationPct}
          onChange={set('creationPct')}
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

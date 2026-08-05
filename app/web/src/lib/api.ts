export interface StatusResponse {
  indexed: number
  count: number
  genesis: number
  commit: string
  updated: string | null
}

export interface AssetCounter {
  number: number
  reinscription: boolean
  content_type: string
}

export interface Counter {
  number: number
  asset: string
  asset_id: string
  content_type: string
  size: number
  body: string | null
  owner: string
  txid: string
  block: number
  position: number
  tx_index: number | null
  sha256: string
  supply: number
  divisible: boolean | null
  locked: boolean | null
  fee: number | null
  tx_size: number | null
  xcp_burned: number | null
  reinscription: boolean
  block_time: number | null
  asset_counters?: AssetCounter[]
}

export interface BlockResponse {
  block: number
  count: number
  counters: Counter[]
}

const BASE: string | null =
  typeof window !== 'undefined' && window.location.protocol.startsWith('http')
    ? window.location.origin
    : null

export const api = {
  async status(): Promise<StatusResponse | null> {
    if (!BASE) return { indexed: ZERO.block, count: 1, genesis: 0, commit: 'dev', updated: null }
    const r = await fetch(`${BASE}/status`)
    if (!r.ok) return null
    return r.json() as Promise<StatusResponse>
  },

  async counters(params?: { before?: number; limit?: number }): Promise<Counter[]> {
    if (!BASE) return [structuredClone(ZERO)]
    const q = new URLSearchParams()
    if (params?.before != null) q.set('before', String(params.before))
    if (params?.limit != null) q.set('limit', String(params.limit))
    const r = await fetch(`${BASE}/counters?${q}`)
    if (!r.ok) return []
    const data = await r.json() as { counters?: Counter[] }
    return data.counters ?? []
  },

  async counter(id: string | number): Promise<Counter | null> {
    if (!BASE) {
      const v = String(id).toUpperCase()
      return (String(id) === '0' || v === 'COUNTERZERO') ? structuredClone(ZERO) : null
    }
    const r = await fetch(`${BASE}/counter/${encodeURIComponent(String(id))}`)
    if (!r.ok) return null
    return r.json() as Promise<Counter>
  },

  async block(height: number): Promise<BlockResponse | null> {
    if (!BASE) {
      const here = height === ZERO.block ? [structuredClone(ZERO)] : []
      return { block: height, count: here.length, counters: here }
    }
    const r = await fetch(`${BASE}/block/${height}`)
    if (!r.ok) return null
    return r.json() as Promise<BlockResponse>
  },

  previewUrl(n: number): string | null {
    return BASE ? `${BASE}/preview/${n}` : null
  },
}

export const ZERO: Counter = {
  number: 0,
  asset: 'COUNTERZERO',
  asset_id: '362634122772624',
  content_type: 'text/plain',
  size: 2,
  body: '0',
  owner: 'bc1pvk6xnanj07h8un6lc25ty0zqd7dfhgh5k5yucztlyut55ynmv66qz8pdf5',
  txid: '6e6e14470434fd01d1d877ab0754dbc90d31ff33a4bb96a37e026d730762ed1f',
  block: 955251,
  position: 415,
  tx_index: 3143138,
  fee: 1552,
  tx_size: 609,
  xcp_burned: 50000000,
  supply: 1000000000,
  divisible: true,
  locked: false,
  reinscription: false,
  block_time: null,
  sha256: '9a271f2a916b0b6ee6cecb2426f0b3206ef074578be55d9bc94f6f3fe3ab86aa',
}

export const LARGE_BYTES = 400_000
export const FULL_BLOCK_BYTES = 3_500_000

export function sizeTag(c: Counter): 'full block' | 'large' | null {
  if (c.size > FULL_BLOCK_BYTES) return 'full block'
  if (c.size > LARGE_BYTES) return 'large'
  return null
}

export function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1_048_576).toFixed(2)} MB`
}

export function fmtDate(t: number): string {
  return new Date(t * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
}

export function fmtSupply(c: Counter): string {
  return c.divisible
    ? (+(c.supply / 1e8).toFixed(8)).toLocaleString('en-US', { maximumFractionDigits: 8 })
    : (+c.supply).toLocaleString()
}

export function short(s: string | null | undefined): string {
  if (!s) return '—'
  return s.length > 22 ? s.slice(0, 10) + '…' + s.slice(-8) : s
}

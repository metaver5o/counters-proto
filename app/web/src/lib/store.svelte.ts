import { api, type StatusResponse, type Counter } from './api.js'

export const PAGE = 100

export let appState = $state({
  status: null as StatusResponse | null,
  counters: [] as Counter[],
  page: null as number | null,
  loading: false,
  error: null as string | null,
})

export async function loadCounters(page: number | null = null): Promise<void> {
  appState.loading = true
  appState.error = null
  try {
    const st = await api.status()
    appState.status = st
    const count = st?.count ?? 1
    const pages = Math.max(1, Math.ceil(count / PAGE))
    const cur = page == null ? null : Math.min(Math.max(0, page), pages - 1)
    appState.page = cur
    if (cur == null) {
      appState.counters = await api.counters({ limit: PAGE })
    } else {
      const start = cur * PAGE
      const n = Math.min(PAGE, count - start)
      appState.counters = n > 0 ? await api.counters({ before: start + PAGE, limit: n }) : []
    }
  } catch (e) {
    appState.error = String(e)
  } finally {
    appState.loading = false
  }
}

export async function loadAllCounters(): Promise<void> {
  appState.loading = true
  appState.error = null
  try {
    const st = await api.status()
    appState.status = st
    const count = st?.count ?? 0
    if (count <= 500) {
      // TODO: if count >= 500, only the first 500 are loaded and filtered — known limitation
      appState.counters = await api.counters({ limit: Math.max(count, 1) })
    } else {
      appState.counters = await api.counters({ limit: 500 })
    }
  } catch (e) {
    appState.error = String(e)
  } finally {
    appState.loading = false
  }
}

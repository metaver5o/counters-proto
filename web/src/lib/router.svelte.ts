export type Route =
  | { view: 'home'; page: number | null }
  | { view: 'detail'; id: string }
  | { view: 'block'; height: number }
  | { view: 'docs' }

function parseRoute(): Route {
  if (typeof window === 'undefined') return { view: 'home', page: null }
  const m = window.location.pathname.match(/^\/c\/(.+)$/)
  if (m) return { view: 'detail', id: decodeURIComponent(m[1]) }
  const hash = window.location.hash || '#/'
  let mm: RegExpMatchArray | null
  if ((mm = hash.match(/^#\/c\/(.+)$/))) return { view: 'detail', id: decodeURIComponent(mm[1]) }
  if ((mm = hash.match(/^#\/p\/(\d+)$/))) return { view: 'home', page: +mm[1] }
  if ((mm = hash.match(/^#\/b\/(\d+)$/))) return { view: 'block', height: +mm[1] }
  if (hash.startsWith('#/docs')) return { view: 'docs' }
  return { view: 'home', page: null }
}

// Wrap in an object so we can mutate .current without reassigning the exported binding.
export const routeState = $state({ current: parseRoute() as Route })

export function syncRoute(): void {
  routeState.current = parseRoute()
}

export function go(hash: string): void {
  if (typeof window === 'undefined') return
  if (window.location.pathname !== '/') {
    window.history.pushState({}, '', '/' + hash)
    routeState.current = parseRoute()
  } else {
    window.location.hash = hash
    // hashchange fires → syncRoute() called by App $effect
  }
}

export function goCounter(id: string | number): void {
  if (typeof window === 'undefined') return
  window.history.pushState({}, '', '/c/' + encodeURIComponent(String(id)))
  routeState.current = parseRoute()
}

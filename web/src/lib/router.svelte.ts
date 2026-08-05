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

export let route = $state<Route>({ view: 'home', page: null })

export function syncRoute(): void {
  route = parseRoute()
}

export function go(hash: string): void {
  if (typeof window === 'undefined') return
  if (window.location.pathname !== '/') {
    window.history.pushState({}, '', '/' + hash)
    route = parseRoute()
  } else {
    window.location.hash = hash
    // hashchange fires and syncRoute() handles the update
  }
}

export function goCounter(id: string | number): void {
  if (typeof window === 'undefined') return
  window.history.pushState({}, '', '/c/' + encodeURIComponent(String(id)))
  route = parseRoute()
}

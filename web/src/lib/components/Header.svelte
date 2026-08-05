<script lang="ts">
  import { go, goCounter, route } from '../router.svelte.js'
  import WalletButton from './WalletButton.svelte'

  let q = $state('')

  function doSearch(e: Event) {
    e.preventDefault()
    const v = q.trim()
    if (!v) return
    goCounter(v)
    q = ''
  }

  const activeExplore = $derived(route.view === 'home' || route.view === 'detail' || route.view === 'block')
  const activeDocs = $derived(route.view === 'docs')
</script>

<header>
  <div class="wrap bar">
    <a
      class="brand"
      href="#/"
      aria-label="Bitcoin Counters home"
      onclick={(e) => { e.preventDefault(); go('#/') }}
    >
      <svg width="34" height="34" viewBox="0 0 120 120" aria-hidden="true">
        <ellipse cx="60" cy="86" rx="33" ry="8" fill="#5b8def"/>
        <ellipse cx="60" cy="73" rx="33" ry="8" fill="#3ec78f"/>
        <ellipse cx="60" cy="60" rx="33" ry="8" fill="#ffd23f"/>
        <ellipse cx="60" cy="47" rx="33" ry="8" fill="#ff9f1c"/>
        <ellipse cx="60" cy="34" rx="33" ry="8" fill="#f0653f"/>
      </svg>
      <span class="brandtext">
        <b>Bitcoin&nbsp;Counters</b>
        <span class="sub">count</span>
      </span>
    </a>

    <nav>
      <a
        href="#/"
        class:on={activeExplore}
        onclick={(e) => { e.preventDefault(); go('#/') }}
      >Explore</a>
      <a
        href="#/docs"
        class:on={activeDocs}
        onclick={(e) => { e.preventDefault(); go('#/docs') }}
      >Docs</a>
      <a href="https://www.bitcoincounters.com" target="_blank" rel="noopener" title="Bitcoin Counters — the current protocol (v3)">V3 ↗</a>
    </nav>

    <form class="search" onsubmit={doSearch}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <input
        bind:value={q}
        placeholder="number or ASSET"
        autocomplete="off"
        spellcheck={false}
        aria-label="Search by counter number or asset"
      />
    </form>

    <WalletButton />
  </div>
</header>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 40;
    background: rgba(20, 17, 13, .82);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
  }
  .bar { display: flex; align-items: center; gap: 18px; height: 62px }
  .brand {
    display: flex;
    align-items: center;
    gap: 11px;
    cursor: pointer;
    flex: 0 0 auto;
    text-decoration: none;
  }
  .brand svg { display: block }
  .brandtext { display: flex; flex-direction: column; gap: 1px }
  .brand b { font-family: var(--mono); font-weight: 600; font-size: 15px; letter-spacing: .02em }
  .brand .sub {
    color: var(--faint);
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: .18em;
    text-transform: uppercase;
    margin-left: 2px;
  }
  nav { display: flex; gap: 4px; margin-left: 6px }
  nav a {
    font-family: var(--mono);
    font-size: 12.5px;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--dim);
    padding: 7px 12px;
    border-radius: 7px;
    transition: .15s;
  }
  nav a:hover { color: var(--ink); background: var(--card) }
  nav a.on { color: var(--copper) }
  .search { margin-left: auto; position: relative; flex: 0 1 260px; min-width: 0 }
  .search input {
    width: 100%;
    background: var(--bg2);
    border: 1px solid var(--line);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 13px;
    padding: 9px 12px 9px 32px;
    border-radius: 9px;
    outline: none;
    transition: .15s;
  }
  .search input::placeholder { color: var(--faint) }
  .search input:focus { border-color: var(--copper); box-shadow: 0 0 0 3px var(--copper-ghost) }
  .search svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--faint) }

  @media (max-width: 620px) {
    header { position: static }
    .bar { flex-wrap: wrap; height: auto; padding: 12px 0; gap: 11px 14px }
    .brand { order: 1 }
    nav { order: 2; width: 100%; margin-left: 0; gap: 6px; flex-wrap: wrap }
    nav a { padding: 8px 12px; font-size: 13px }
    .search { order: 3; flex-basis: 100%; margin-left: 0 }
  }
</style>

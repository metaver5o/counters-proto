<script lang="ts">
  import { appState, loadCounters, loadAllCounters, PAGE } from '../lib/store.svelte.js'
  import { go, goCounter } from '../lib/router.svelte.js'
  import Meter from '../lib/components/Meter.svelte'
  import TabBar from '../lib/components/TabBar.svelte'
  import CounterCard from '../lib/components/CounterCard.svelte'

  const { page }: { page: number | null } = $props()

  type Tab = 'all' | 'images' | 'text' | 'other'
  let activeTab = $state<Tab>('all')

  // Load counters whenever page or tab changes
  $effect(() => {
    if (activeTab !== 'all') {
      loadAllCounters()
    } else {
      loadCounters(page)
    }
  })

  const filteredCounters = $derived.by(() => {
    if (activeTab === 'all') return appState.counters
    return appState.counters.filter((c) => {
      const ct = c.content_type.toLowerCase()
      if (activeTab === 'images') return ct.startsWith('image/')
      if (activeTab === 'text') return ct.startsWith('text/')
      return !ct.startsWith('image/') && !ct.startsWith('text/')
    })
  })

  const status = $derived(appState.status)
  const count = $derived(status?.count ?? 0)
  const pages = $derived(Math.max(1, Math.ceil(count / PAGE)))
  const isLatest = $derived(page == null)
  const curPage = $derived(isLatest ? pages - 1 : Math.min(Math.max(0, page ?? 0), pages - 1))

  const oldest = $derived(appState.counters.length ? appState.counters[appState.counters.length - 1].number : 0)
  const newest = $derived(appState.counters.length ? appState.counters[0].number : 0)

  const rangeMeta = $derived(
    appState.counters.length
      ? `#${oldest}–#${newest} · ${isLatest ? `latest ${appState.counters.length}` : `page ${curPage + 1} of ${pages}`}`
      : ''
  )

  const olderLink = $derived(
    isLatest
      ? (oldest > 0 ? `#/p/${Math.floor((oldest - 1) / PAGE)}` : null)
      : (curPage > 0 ? `#/p/${curPage - 1}` : null)
  )
  const newerLink = $derived(
    !isLatest && curPage < pages - 1
      ? (curPage + 1 === pages - 1 ? '#/' : `#/p/${curPage + 1}`)
      : null
  )

  let toastMsg = $state('')
  let toastVisible = $state(false)
  let toastTimer = 0

  function showToast(msg: string) {
    toastMsg = msg
    toastVisible = true
    clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => { toastVisible = false }, 1400)
  }
</script>

<!-- Hero -->
<section class="hero">
  <div class="wrap">
    <img src="/counters-logo.svg" alt="Bitcoin Counters logo" class="logo" width="80" height="80" />
    <div class="hero-meter">
      <Meter value={count} />
    </div>
    <p class="lede">Numbered inscriptions on Bitcoin. Owned through Counterparty.</p>
    {#if status}
      <div class="meterlabel">
        indexed block <b>
          <a
            class="blocklink"
            href="#/b/{status.indexed}"
            onclick={(e) => { e.preventDefault(); go(`#/b/${status.indexed}`) }}
          >{status.indexed.toLocaleString()}</a>
        </b>
        {#if count > 0}
          <span class="tick">· {count} counter{count === 1 ? '' : 's'}</span>
        {/if}
      </div>
    {/if}
  </div>
</section>

<!-- Explorer -->
<div class="wrap explorer">
  {#if status}
    <div class="synced">
      <span class="lab">Latest synced block</span>
      <a
        class="blk"
        href="#/b/{status.indexed}"
        onclick={(e) => { e.preventDefault(); go(`#/b/${status.indexed}`) }}
        title="view this block"
      >
        <Meter value={status.indexed} />
      </a>
      <span class="tick">{count} counter{count === 1 ? '' : 's'} detected</span>
    </div>
  {/if}

  <div class="sechead">
    <h2>Counters</h2>
    <div class="rule"></div>
    <div class="meta">{rangeMeta}</div>
  </div>

  <TabBar active={activeTab} onSelect={(t) => { activeTab = t }} />

  {#if appState.loading}
    <div class="loading">Loading…</div>
  {:else if filteredCounters.length === 0}
    <div class="empty">
      <b>{activeTab !== 'all' ? `No ${activeTab} counters` : 'The sequence has just begun'}</b>
      {activeTab !== 'all' ? 'No counters match this filter yet.' : "Counter #0 is the genesis. New counters appear here as they're minted."}
    </div>
  {:else}
    <div class="grid">
      {#each filteredCounters as counter (counter.number)}
        <CounterCard {counter} />
      {/each}
    </div>
  {/if}

  {#if pages > 1 && activeTab === 'all'}
    <div class="pager">
      <a
        class:off={!olderLink}
        href={olderLink ?? '#/'}
        onclick={(e) => { e.preventDefault(); if (olderLink) go(olderLink) }}
      >← older</a>
      <span class="pinfo">{isLatest ? 'latest' : `page ${curPage + 1} / ${pages}`}</span>
      <a
        class:off={!newerLink}
        href={newerLink ?? '#/'}
        onclick={(e) => { e.preventDefault(); if (newerLink) go(newerLink) }}
      >newer →</a>
    </div>
  {/if}
</div>

<div class="toast" class:show={toastVisible}>{toastMsg}</div>

<style>
  .hero {
    padding: 64px 0 38px;
    border-bottom: 1px solid var(--line);
  }
  .logo { display: block; margin-bottom: 24px }
  .hero-meter :global(.d) {
    font-size: clamp(34px, 6vw, 58px);
    width: .78em;
    height: 1.32em;
  }
  .hero-meter :global(.sep) { font-size: clamp(34px, 6vw, 58px) }
  .lede { color: var(--dim); max-width: 56ch; margin: 16px 0 0; font-size: 16px }
  .meterlabel {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: .16em;
    text-transform: uppercase;
    color: var(--faint);
    margin: 14px 0 0;
  }
  .meterlabel b { color: var(--dim); font-weight: 500 }
  .meterlabel .tick { color: var(--patina) }
  .blocklink { cursor: pointer }

  .explorer { padding-top: 30px; padding-bottom: 64px }

  .synced { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin: 0 0 12px }
  .synced .lab { font-family: var(--mono); font-size: 11.5px; letter-spacing: .16em; text-transform: uppercase; color: var(--faint) }
  .synced .blk { cursor: pointer; display: inline-flex }
  .synced .blk :global(.d) { font-size: 18px; width: .92em; height: 1.45em; color: var(--ink) }
  .synced .blk :global(.sep) { font-size: 18px }
  .synced .blk:hover :global(.d) { color: var(--copper2) }
  .synced .tick { font-family: var(--mono); font-size: 12px; color: var(--patina) }

  .sechead { display: flex; align-items: baseline; gap: 14px; margin: 48px 0 18px }
  .sechead h2 { font-family: var(--mono); font-weight: 600; font-size: 14px; letter-spacing: .14em; text-transform: uppercase; margin: 0 }
  .sechead .rule { flex: 1; height: 1px; background: var(--line) }
  .sechead .meta { font-family: var(--mono); font-size: 12px; color: var(--faint) }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 16px }

  .pager { display: flex; justify-content: center; align-items: center; gap: 14px; margin: 28px 0 0; font-family: var(--mono); font-size: 12.5px }
  .pager a { color: var(--dim); border: 1px solid var(--line); background: var(--card); padding: 9px 18px; border-radius: 9px; cursor: pointer; letter-spacing: .08em; text-transform: uppercase; transition: .15s }
  .pager a:hover { color: var(--ink); border-color: var(--copper) }
  .pager a.off { opacity: .35; pointer-events: none }
  .pinfo { color: var(--faint); letter-spacing: .1em }

  .loading { padding: 40px 0; color: var(--faint); font-family: var(--mono); text-align: center }
</style>

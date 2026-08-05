<script lang="ts">
  import { api, type Counter } from '../lib/api.js'
  import { go } from '../lib/router.svelte.js'
  import CounterCard from '../lib/components/CounterCard.svelte'

  const { height }: { height: number } = $props()

  let counters = $state<Counter[]>([])
  let blockCount = $state(0)
  let loading = $state(true)
  let error = $state<string | null>(null)

  $effect(() => {
    loading = true
    error = null
    api.block(height).then((b) => {
      if (!b) { error = `Block ${height} not found`; counters = []; blockCount = 0 }
      else { counters = b.counters; blockCount = b.count }
      loading = false
    }).catch((e) => {
      error = String(e)
      loading = false
    })
  })
</script>

<div class="wrap" style="padding-top:30px;padding-bottom:64px">
  <button class="backlink" onclick={() => history.length > 1 ? history.back() : go('#/')}>
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M10 3l-5 5 5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Back
  </button>

  <div class="sechead">
    <h2>Block {height.toLocaleString()}</h2>
    <div class="rule"></div>
    {#if !loading}
      <div class="meta">{blockCount} counter{blockCount === 1 ? '' : 's'} in this block</div>
    {/if}
  </div>

  {#if loading}
    <div class="empty"><b>Loading…</b></div>
  {:else if error}
    <div class="empty"><b>Error</b>{error}</div>
  {:else if counters.length === 0}
    <div class="empty">
      <b>No counters in this block</b>
      Block {height.toLocaleString()} has no indexed counters.
    </div>
  {:else}
    <div class="grid">
      {#each counters as counter (counter.number)}
        <CounterCard {counter} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .backlink {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: var(--mono); font-size: 12px; letter-spacing: .06em; text-transform: uppercase;
    color: var(--dim); background: none; border: 1px solid var(--line); border-radius: 7px;
    padding: 5px 11px; cursor: pointer; margin-bottom: 24px; transition: .15s;
  }
  .backlink:hover { color: var(--copper) }
  .sechead { display: flex; align-items: baseline; gap: 14px; margin: 0 0 18px }
  .sechead h2 { font-family: var(--mono); font-weight: 600; font-size: 14px; letter-spacing: .14em; text-transform: uppercase; margin: 0 }
  .sechead .rule { flex: 1; height: 1px; background: var(--line) }
  .sechead .meta { font-family: var(--mono); font-size: 12px; color: var(--faint) }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 16px }
</style>

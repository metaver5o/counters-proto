<script lang="ts">
  import { go, goCounter } from '../router.svelte.js'
  import { appState } from '../store.svelte.js'

  const REPO = 'https://github.com/BitcoinCounters/counters-proto'

  const buildParts = $derived.by(() => {
    const st = appState.status
    if (!st) return null
    const commit = st.commit || 'dev'
    const updated = st.updated
    return { commit, updated }
  })
</script>

<footer>
  <div class="wrap frow">
    <div class="lk">
      <b>Explore</b>
      <a href="#/" onclick={(e) => { e.preventDefault(); go('#/') }}>Latest counters</a>
      <a href="/c/0" onclick={(e) => { e.preventDefault(); goCounter('0') }}>Counter #0 · COUNTERZERO</a>
      <a href="#/docs" onclick={(e) => { e.preventDefault(); go('#/docs') }}>Documentation</a>
      <a href="https://www.bitcoincounters.com" target="_blank" rel="noopener">Bitcoin Counters (v3) ↗</a>
      <a href="https://t.me/BitcoinCounters" target="_blank" rel="noopener">Telegram ↗</a>
    </div>
    <div class="lk">
      <b>Server API</b>
      <span><code>GET /status</code></span>
      <span><code>GET /counters</code></span>
      <span><code>GET /counter/:id</code></span>
      <span><code>GET /block/:height</code></span>
      <span><code>GET /content/:n</code></span>
      <span><code>GET /preview/:n</code></span>
    </div>
    <div class="lk colophon">
      The reference frontend for <code>counters&nbsp;server</code>. Counters are files in Bitcoin witness data, owned through Counterparty assets, numbered from zero.
      {#if buildParts}
        <div class="build">
          {#if buildParts.commit !== 'dev'}
            build <a href="{REPO}/commit/{encodeURIComponent(buildParts.commit)}" target="_blank" rel="noopener"><code>{buildParts.commit}</code></a>
          {:else}
            build <code>{buildParts.commit}</code>
          {/if}
          {#if buildParts.updated}
            · updated <code>{buildParts.updated.slice(0, 16).replace('T', ' ')} UTC</code>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</footer>

<style>
  footer { border-top: 1px solid var(--line); padding: 34px 0; color: var(--faint) }
  .frow { display: flex; flex-wrap: wrap; gap: 26px 40px; align-items: flex-start; justify-content: space-between }
  .lk { font-family: var(--mono); font-size: 12.5px; color: var(--dim) }
  .lk b { display: block; color: var(--faint); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 9px; font-weight: 500 }
  .lk a { display: block; padding: 3px 0; color: var(--dim) }
  .lk a:hover { color: var(--copper) }
  .lk code { font-family: var(--mono); color: var(--patina); font-size: 12px }
  .colophon { font-family: var(--mono); font-size: 11.5px; max-width: 34ch; line-height: 1.7 }
  .build { margin-top: 14px; font-family: var(--mono); font-size: 11px; color: var(--faint) }
  .build a { color: var(--patina) }
  .build code { font-family: var(--mono) }

  @media (max-width: 860px) { .frow { justify-content: flex-start; gap: 28px 52px } }
  @media (max-width: 620px) {
    .frow { gap: 30px }
    .lk, .colophon { flex-basis: 100%; max-width: none }
  }
</style>

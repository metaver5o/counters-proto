<script lang="ts">
  import { api, type Counter, fmtSize, fmtDate, fmtSupply, short, LARGE_BYTES, FULL_BLOCK_BYTES, sizeTag } from '../lib/api.js'
  import { go, goCounter } from '../lib/router.svelte.js'
  import { walletState } from '../lib/wallet/store.svelte.js'
  import ContentFrame from '../lib/components/ContentFrame.svelte'
  import Meter from '../lib/components/Meter.svelte'

  const { id }: { id: string } = $props()

  let counter = $state<Counter | null>(null)
  let loading = $state(true)
  let notFound = $state(false)

  $effect(() => {
    loading = true
    notFound = false
    counter = null
    api.counter(id).then((c) => {
      counter = c
      notFound = !c
      loading = false
      if (c) document.title = `Counter #${c.number} · ${c.asset} — Bitcoin Counters`
    }).catch(() => {
      notFound = true
      loading = false
    })
  })

  function copy(text: string) {
    navigator.clipboard?.writeText(text)
  }

  const tag = $derived(counter ? sizeTag(counter) : null)
  const mpUrl = $derived(counter ? `https://mempool.space/tx/${counter.txid}` : '')
  const xcpUrl = $derived(counter ? `https://tokenscan.io/asset/${encodeURIComponent(counter.asset)}` : '')
  const tsTxUrl = $derived(
    counter?.tx_index != null ? `https://tokenscan.io/tx/${counter.tx_index}` : null
  )
  const ownsThis = $derived(
    counter != null && walletState.connected && (
      counter.owner === walletState.address ||
      counter.owner === walletState.ordinalsAddress
    )
  )
</script>

<div class="wrap detail">
  <button class="backlink" onclick={() => history.length > 1 ? history.back() : go('#/')}>
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M10 3l-5 5 5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Back
  </button>

  {#if loading}
    <div class="empty" style="padding-top:80px"><b>Loading…</b></div>
  {:else if notFound || !counter}
    <div class="empty" style="padding-top:80px">
      <b>No counter found</b>
      Nothing matches "{id}". Try a counter number or an asset name.
    </div>
  {:else}
    <div class="dwrap">
      <!-- Full-bleed content frame -->
      <div class="stage">
        <div class="frame">
          <ContentFrame counter={counter} />
          <div class="cap">
            <span>{counter.content_type}</span>
            <span>·</span>
            <span>{fmtSize(counter.size)}</span>
          </div>
        </div>
      </div>

      <div class="dbody">
        <div class="dhead">
          <Meter value={counter.number} />
          <h1>{counter.asset}</h1>
        </div>

        <span class="vbadge"><span class="dot"></span>valid counter</span>
        {#if counter.reinscription}
          <span class="vbadge re"><span class="dot"></span>reinscription</span>
        {/if}
        {#if tag === 'full block'}
          <span class="vbadge fb" title="over 3.5 MB — fills an entire Bitcoin block"><span class="dot"></span>full block</span>
        {:else if tag === 'large'}
          <span class="vbadge lg" title="over 400 KB — mined by direct miner submission"><span class="dot"></span>large</span>
        {/if}

        <div class="facts">
          <div class="fact"><div class="k">asset</div><div class="v">
            <a href={xcpUrl} target="_blank" rel="noopener" class="out">{counter.asset} ↗</a>
          </div></div>

          <div class="fact"><div class="k">asset_id</div><div class="v">
            {counter.asset_id}
            <button class="copy" onclick={() => copy(counter!.asset_id)}>copy</button>
          </div></div>

          {#if counter.supply != null}
            <div class="fact"><div class="k">supply</div><div class="v">
              {fmtSupply(counter)}{counter.divisible ? ' · divisible' : ''}
            </div></div>
          {/if}

          {#if counter.locked != null}
            <div class="fact"><div class="k">locked</div><div class="v">{counter.locked ? 'yes' : 'no'}</div></div>
          {/if}

          <div class="fact"><div class="k">content type</div><div class="v">{counter.content_type}</div></div>
          <div class="fact"><div class="k">size</div><div class="v">{fmtSize(counter.size)}</div></div>

          <div class="fact"><div class="k">owner</div><div class="v">
            {short(counter.owner)}
            <button class="copy" onclick={() => copy(counter!.owner)}>copy</button>
            {#if ownsThis}<span class="own-badge">You own this</span>{/if}
          </div></div>

          <div class="fact"><div class="k">block</div><div class="v">
            <a
              class="blocklink"
              href="#/b/{counter.block}"
              onclick={(e) => { e.preventDefault(); go(`#/b/${counter!.block}`) }}
            >{counter.block.toLocaleString()}</a> · pos {counter.position}
          </div></div>

          {#if counter.block_time}
            <div class="fact"><div class="k">created</div><div class="v">{fmtDate(counter.block_time)}</div></div>
          {/if}

          <div class="fact"><div class="k">mint tx</div><div class="v">
            <a href={mpUrl} target="_blank" rel="noopener" class="out">{short(counter.txid)} ↗</a>
            <button class="copy" onclick={() => copy(counter!.txid)}>copy</button>
          </div></div>

          {#if counter.fee != null}
            <div class="fact"><div class="k">fee paid</div><div class="v">{counter.fee.toLocaleString()} sats</div></div>
          {/if}
          {#if counter.fee != null && counter.tx_size}
            <div class="fact"><div class="k">fee/B</div><div class="v">{(counter.fee / counter.tx_size).toFixed(1)} sats</div></div>
          {/if}
          {#if counter.xcp_burned != null}
            <div class="fact"><div class="k">xcp burned</div><div class="v">
              {#if tsTxUrl}
                <a href={tsTxUrl} target="_blank" rel="noopener" class="out">
                  {+(counter.xcp_burned / 1e8).toFixed(8)} XCP ↗
                </a>
              {:else}
                {+(counter.xcp_burned / 1e8).toFixed(8)} XCP
              {/if}
            </div></div>
          {/if}

          <div class="fact"><div class="k">sha-256</div><div class="v">
            {short(counter.sha256)}
            <button class="copy" onclick={() => copy(counter!.sha256)}>copy</button>
          </div></div>
        </div>

        {#if counter.asset_counters && counter.asset_counters.length > 1}
          <div class="acs">
            <div class="k">{counter.asset_counters.length} counters on {counter.asset}</div>
            <div class="list">
              {#each counter.asset_counters as ac}
                <a
                  class="{ac.number === counter.number ? 'cur ' : ''}{ac.reinscription ? 're' : ''}"
                  href="/c/{ac.number}"
                  onclick={(e) => { e.preventDefault(); goCounter(ac.number) }}
                >
                  #{ac.number}
                  <em>{ac.reinscription ? 'reinscription' : 'original'}</em>
                </a>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .wrap.detail { max-width: none; padding: 0 0 70px; position: relative }
  .backlink {
    position: absolute; top: 14px; left: 14px; z-index: 5;
    display: inline-flex; align-items: center; gap: 8px;
    font-family: var(--mono); font-size: 12px; letter-spacing: .06em; text-transform: uppercase;
    color: var(--dim); background: #0009; border: 1px solid var(--line); border-radius: 7px;
    padding: 5px 11px; cursor: pointer; transition: .15s;
  }
  .backlink:hover { color: var(--copper) }
  .dwrap { display: block }
  .stage .frame {
    height: calc(100dvh - var(--head) - 150px);
    min-height: 340px;
    background: var(--bg2);
    border-bottom: 1px solid var(--line);
    overflow: hidden;
    position: relative;
  }
  .stage .cap {
    position: absolute; bottom: 14px; right: 14px; z-index: 5;
    display: flex; gap: 8px;
    font-family: var(--mono); font-size: 11px; letter-spacing: .06em; color: var(--dim);
    background: #0009; border: 1px solid var(--line); border-radius: 7px; padding: 4px 10px;
    pointer-events: none;
  }
  .dbody { max-width: var(--wrap); margin: 30px auto 0; padding: 0 22px }
  .dhead { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 6px }
  .dhead :global(.d) { font-size: 26px; width: .82em; height: 1.34em; color: var(--ink) }
  .dhead h1 { font-family: var(--mono); font-weight: 600; font-size: 30px; margin: 0; color: var(--copper2); word-break: break-all; line-height: 1.1 }

  .vbadge {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: var(--mono); font-size: 11.5px; letter-spacing: .1em; text-transform: uppercase;
    color: var(--patina); border: 1px solid var(--patina-dim); border-radius: 99px;
    padding: 4px 11px; margin: 14px 0 26px;
  }
  .vbadge .dot { width: 6px; height: 6px; border-radius: 99px; background: var(--patina); box-shadow: 0 0 8px var(--patina) }
  .vbadge.re { color: var(--copper2); border-color: var(--copper2); margin-left: 8px }
  .vbadge.re .dot { background: var(--copper2); box-shadow: 0 0 8px var(--copper2) }
  .vbadge.lg { color: var(--gold); border-color: var(--gold); margin-left: 8px }
  .vbadge.lg .dot { background: var(--gold); box-shadow: 0 0 8px var(--gold) }
  .vbadge.fb { color: var(--copper2); border-color: var(--copper2); margin-left: 8px }
  .vbadge.fb .dot { background: var(--copper2); box-shadow: 0 0 8px var(--copper2) }

  .facts { border-top: 1px solid var(--line) }
  .fact { display: grid; grid-template-columns: 130px 1fr; gap: 16px; padding: 13px 0; border-bottom: 1px solid var(--line2); align-items: baseline }
  .fact .k { font-family: var(--mono); font-size: 11.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--faint) }
  .fact .v { font-family: var(--mono); font-size: 13.5px; color: var(--ink); word-break: break-all; line-height: 1.5 }
  .fact .v :global(a) { color: var(--copper2); border-bottom: 1px solid transparent; transition: .15s }
  .fact .v :global(a:hover) { border-color: var(--copper2) }
  .fact .v :global(.out) { display: inline-flex; align-items: center; gap: 5px }
  .blocklink { cursor: pointer }

  .copy {
    cursor: pointer; color: var(--faint); border: none; background: none;
    padding: 0 0 0 7px; font-family: var(--mono); font-size: 11px;
  }
  .copy:hover { color: var(--patina) }

  .own-badge {
    display: inline-block;
    padding: .15rem .5rem;
    border: 1px solid var(--patina);
    border-radius: 3px;
    color: var(--patina);
    font-size: .75rem;
    margin-left: .5rem;
  }

  .acs { margin-top: 26px }
  .acs .k { font-family: var(--mono); font-size: 11.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--faint); margin-bottom: 10px }
  .acs .list { display: flex; flex-wrap: wrap; gap: 8px }
  .acs a {
    display: inline-flex; flex-direction: column; align-items: center; gap: 2px;
    font-family: var(--mono); font-size: 12.5px; color: var(--ink);
    border: 1px solid var(--line); border-radius: 10px; padding: 6px 11px;
    cursor: pointer; text-decoration: none;
  }
  .acs a:hover { border-color: var(--patina-dim) }
  .acs a.cur { border-color: var(--copper2); background: var(--bg2) }
  .acs a em { font-style: normal; font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--faint) }
  .acs a.re em { color: var(--copper2) }

  @media (max-width: 620px) {
    .stage .frame { height: 72dvh }
  }
</style>

<script lang="ts">
  import { goCounter } from '../router.svelte.js'
  import { type Counter, FULL_BLOCK_BYTES, sizeTag } from '../api.js'
  import ContentFrame from './ContentFrame.svelte'
  import Meter from './Meter.svelte'

  const { counter }: { counter: Counter } = $props()

  const ext = $derived((counter.content_type || '').split('/')[1] || counter.content_type)
  const tag = $derived(sizeTag(counter))

  function navigate() { goCounter(counter.number) }
</script>

<div
  class="card"
  role="button"
  tabindex="0"
  aria-label="Counter #{counter.number} {counter.asset}"
  onclick={navigate}
  onkeydown={(e) => e.key === 'Enter' && navigate()}
>
  <div class="thumb">
    <span class="ext">{ext}</span>
    {#if tag}
      <span class="ext large {counter.size > FULL_BLOCK_BYTES ? 'fb' : ''}">{tag}</span>
    {/if}
    <ContentFrame {counter} />
  </div>
  <div class="cfoot">
    <span class="num"><Meter value={counter.number} /></span>
    <span class="asset">{counter.asset}</span>
  </div>
</div>

<style>
  .card {
    background: var(--card);
    border: 1px solid var(--line2);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: .16s;
    display: flex;
    flex-direction: column;
  }
  .card:hover {
    border-color: var(--copper);
    transform: translateY(-3px);
    box-shadow: 0 10px 24px -14px #000;
  }
  .thumb {
    aspect-ratio: 1;
    background: var(--bg2);
    border-bottom: 1px solid var(--line2);
    position: relative;
    overflow: hidden;
  }
  /* stop iframe from intercepting pointer on card hover */
  .thumb :global(iframe.sandboxed) { pointer-events: none }
  .ext {
    position: absolute;
    top: 8px;
    right: 8px;
    font-family: var(--mono);
    font-size: 9.5px;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--dim);
    background: #0009;
    border: 1px solid var(--line);
    padding: 2px 6px;
    border-radius: 5px;
    z-index: 1;
  }
  .ext.large {
    right: auto;
    left: 8px;
    color: var(--gold);
    border-color: var(--gold);
  }
  .ext.large.fb { color: var(--copper2); border-color: var(--copper2) }
  .cfoot {
    padding: 11px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .num :global(.d) { font-size: 13px; width: 1.05em; height: 1.5em; color: var(--ink) }
  .asset {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--copper2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>

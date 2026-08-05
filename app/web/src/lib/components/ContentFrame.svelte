<script lang="ts">
  import { api, type Counter } from '../api.js'

  const { counter }: { counter: Counter } = $props()

  const previewUrl = $derived(api.previewUrl(counter.number))
  const ct = $derived((counter.content_type || '').split(';')[0].trim().toLowerCase())
  const isActive = $derived(
    ct === 'text/html' || ct === 'image/svg+xml' || ct.startsWith('model/')
  )
  const sandbox = $derived(isActive ? 'allow-scripts' : 'allow-same-origin')
</script>

<div class="render">
  {#if previewUrl}
    <iframe
      class="sandboxed"
      sandbox={sandbox}
      referrerpolicy="no-referrer"
      loading="lazy"
      title="counter {counter.number}"
      src={previewUrl}
    ></iframe>
  {:else if ct === 'text/plain'}
    {@const body = counter.body ?? ''}
    {@const fs = body.length <= 4 ? 40 : body.length <= 10 ? 27 : body.length <= 24 ? 18 : 14}
    <div class="txt" style="font-size:{fs}px">{body}</div>
  {:else if ct === 'application/json'}
    <div class="txt json">{counter.body ?? ''}</div>
  {:else}
    <div class="blob">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <path d="M6 2h8l4 4v16H6z" stroke="#6e6253" stroke-width="1.4"/>
        <path d="M14 2v4h4" stroke="#6e6253" stroke-width="1.4"/>
      </svg>
      {ct}
    </div>
  {/if}
</div>

<style>
  .render {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .render :global(svg), .render :global(img) {
    width: 100%; height: 100%; object-fit: contain; display: block;
  }
  .render .sandboxed {
    width: 100%; height: 100%; border: 0; display: block; background: #fff;
  }
  .txt {
    font-family: var(--mono);
    color: var(--ink);
    padding: 16px;
    text-align: center;
    line-height: 1.35;
    max-width: 100%;
    max-height: 100%;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
  }
  .txt.json {
    font-size: 12px;
    text-align: left;
    white-space: pre;
    -webkit-line-clamp: 8;
  }
  .blob {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 9px;
    color: var(--faint);
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
</style>

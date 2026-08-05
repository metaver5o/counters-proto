<script lang="ts">
  import { walletState } from '../lib/wallet/store.svelte.js'
  import FeeAdvisor from '../lib/components/FeeAdvisor.svelte'
  import NameSuggest from '../lib/components/NameSuggest.svelte'

  const NAME_RE = /^[A-Z]{4,12}$/

  let nlText = $state('')
  let nlLoading = $state(false)
  let nlErr = $state<string | null>(null)
  let nlResult = $state<{ name: string | null; supply: number; divisible: boolean } | null>(null)

  let file = $state<File | null>(null)
  let filePreview = $state('')

  let assetName = $state('')
  let nameErr = $state<string | null>(null)

  let supply = $state(1)
  let selectedTier = $state<'fastest' | 'standard' | 'economy'>('standard')

  async function parseMint() {
    if (!nlText.trim()) return
    nlLoading = true
    nlErr = null
    nlResult = null
    try {
      const r = await fetch('/ai/mint-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlText }),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      nlResult = data
      if (data.name) assetName = String(data.name).toUpperCase()
      if (data.supply) supply = data.supply
    } catch (e) {
      nlErr = e instanceof Error ? e.message : 'Parse failed'
    } finally {
      nlLoading = false
    }
  }

  async function pickFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const picked = input.files?.[0] ?? null
    file = picked
    filePreview = ''
    if (!picked) return
    if (picked.type.startsWith('text/') || picked.type === 'application/json') {
      const text = await picked.text()
      filePreview = text.slice(0, 300)
    }
  }

  function handleNameInput(e: Event) {
    const v = (e.currentTarget as HTMLInputElement).value.toUpperCase()
    assetName = v
    nameErr = v !== '' && !NAME_RE.test(v) ? '4-12 uppercase letters only' : null
  }

  function applyNameSuggest(name: string) {
    assetName = name
    nameErr = null
  }

  function openWallet() {
    window.dispatchEvent(new CustomEvent('wallet-connect'))
  }

  const isNumeric = $derived(assetName === '')
  const nameValid = $derived(assetName === '' || NAME_RE.test(assetName))
  const summaryReady = $derived(nameValid && supply > 0)

  const cliCommand = $derived.by(() => {
    const asset = isNumeric ? '--numeric' : `--asset ${assetName}`
    const sup = `--supply ${supply}`
    const fee = `--fee-tier ${selectedTier}`
    const attachment = file ? ` --file "${file.name}"` : ''
    return `counters-proto mint ${asset} ${sup} ${fee}${attachment}`
  })
</script>

<div class="mint-page wrap">
  <h1 class="page-title">Mint a Counter</h1>

  <section class="section">
    <h2 class="section-title">Describe what to mint</h2>
    <textarea
      class="nl-input"
      placeholder="e.g. mint 1000 BITCOIN tokens, divisible"
      bind:value={nlText}
      rows="3"
    ></textarea>
    <div class="row-end">
      <button class="btn-primary" onclick={parseMint} disabled={nlLoading || !nlText.trim()}>
        {nlLoading ? 'Parsing…' : 'Parse'}
      </button>
    </div>
    {#if nlErr}
      <p class="err">{nlErr}</p>
    {/if}
    {#if nlResult}
      <div class="result-grid">
        <span class="tag">name</span>
        <span class="val">{nlResult.name ?? 'numeric'}</span>
        <span class="tag">supply</span>
        <span class="val">{nlResult.supply.toLocaleString()}</span>
        <span class="tag">divisible</span>
        <span class="val">{nlResult.divisible ? 'yes' : 'no'}</span>
      </div>
    {/if}
  </section>

  <section class="section">
    <h2 class="section-title">Attach file (optional)</h2>
    <label class="file-label">
      <input type="file" class="file-input" onchange={pickFile} />
      <span class="file-btn">Choose file</span>
      {#if file}
        <span class="file-info">{file.name}&nbsp;·&nbsp;<span class="dim">{file.type || 'unknown'}</span></span>
      {:else}
        <span class="file-hint">No file selected</span>
      {/if}
    </label>

    {#if file}
      <div class="name-suggest-wrap">
        <NameSuggest
          filename={file.name}
          mime={file.type}
          preview={filePreview}
          onselect={applyNameSuggest}
        />
      </div>
    {/if}
  </section>

  <section class="section">
    <h2 class="section-title">Asset name</h2>
    <input
      class="text-input"
      class:err-border={!nameValid && assetName !== ''}
      type="text"
      placeholder="Leave empty for numeric"
      value={assetName}
      oninput={handleNameInput}
      maxlength="12"
      spellcheck={false}
      autocomplete="off"
    />
    {#if nameErr}
      <p class="err">{nameErr}</p>
    {:else}
      <p class="hint">4-12 uppercase letters, or leave empty for a numeric counter</p>
    {/if}
  </section>

  <section class="section">
    <h2 class="section-title">Supply</h2>
    <input class="text-input narrow" type="number" min="1" bind:value={supply} />
  </section>

  <section class="section">
    <h2 class="section-title">Fee tier</h2>
    <FeeAdvisor bind:selectedTier />
  </section>

  {#if summaryReady}
    <section class="section summary-section">
      <h2 class="section-title">Summary</h2>
      <div class="result-grid">
        <span class="tag">Asset</span>
        <span class="val">{isNumeric ? 'numeric (auto-assigned)' : assetName}</span>
        <span class="tag">Supply</span>
        <span class="val">{supply.toLocaleString()}</span>
        <span class="tag">Fee tier</span>
        <span class="val capitalize">{selectedTier}</span>
        {#if file}
          <span class="tag">File</span>
          <span class="val">{file.name}</span>
        {/if}
      </div>

      {#if !walletState.connected}
        <p class="connect-prompt">
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span
            class="connect-link"
            role="button"
            tabindex="0"
            onclick={openWallet}
            onkeydown={(e) => e.key === 'Enter' && openWallet()}
          >Connect wallet</span>
          to mint on-chain, or run this CLI command locally:
        </p>
      {:else}
        <p class="ready-prompt">Wallet connected — use the counters-proto CLI with these params:</p>
      {/if}

      <pre class="cli-block"><code>{cliCommand}</code></pre>
    </section>
  {/if}
</div>

<style>
  .mint-page { padding-top: 36px; padding-bottom: 60px }
  .page-title {
    font-family: var(--mono); font-size: 22px; font-weight: 600;
    color: var(--ink); margin: 0 0 32px; letter-spacing: .02em;
  }
  .section { margin-bottom: 32px }
  .section-title {
    font-family: var(--mono); font-size: 12px; letter-spacing: .1em;
    text-transform: uppercase; color: var(--dim); margin: 0 0 12px; font-weight: 500;
  }

  .nl-input {
    width: 100%; background: var(--bg2); border: 1px solid var(--line);
    color: var(--ink); font-family: var(--sans); font-size: 14px;
    padding: 12px 14px; border-radius: 9px; outline: none; resize: vertical; transition: .15s;
  }
  .nl-input:focus { border-color: var(--copper); box-shadow: 0 0 0 3px var(--copper-ghost) }
  .nl-input::placeholder { color: var(--faint) }

  .row-end { display: flex; justify-content: flex-end; margin-top: 10px }

  .btn-primary {
    background: var(--copper); color: #1a0e08; font-family: var(--mono);
    font-size: 13px; font-weight: 600; letter-spacing: .06em;
    border: none; border-radius: 7px; padding: 9px 20px; cursor: pointer; transition: .15s;
  }
  .btn-primary:hover:not(:disabled) { background: var(--copper2) }
  .btn-primary:disabled { opacity: .5; cursor: default }

  .result-grid {
    display: grid; grid-template-columns: auto 1fr; gap: 6px 16px;
    align-items: baseline; font-family: var(--mono); font-size: 13px;
    background: var(--card); border: 1px solid var(--line); border-radius: 9px; padding: 14px 16px;
    margin-top: 12px;
  }
  .tag { color: var(--dim); font-size: 11px; letter-spacing: .08em; text-transform: uppercase }
  .val { color: var(--ink) }
  .capitalize { text-transform: capitalize }
  .dim { color: var(--dim) }

  .file-label { display: flex; align-items: center; gap: 12px; cursor: pointer }
  .file-input { display: none }
  .file-btn {
    background: var(--bg2); border: 1px solid var(--line); border-radius: 7px;
    color: var(--dim); font-family: var(--mono); font-size: 12px;
    padding: 7px 14px; transition: .15s; white-space: nowrap;
  }
  .file-label:hover .file-btn { border-color: var(--copper); color: var(--ink) }
  .file-info { font-family: var(--mono); font-size: 13px; color: var(--ink) }
  .file-hint { font-family: var(--mono); font-size: 12px; color: var(--faint) }
  .name-suggest-wrap { margin-top: 14px }

  .text-input {
    background: var(--bg2); border: 1px solid var(--line); color: var(--ink);
    font-family: var(--mono); font-size: 14px; padding: 10px 14px;
    border-radius: 9px; outline: none; width: 100%; transition: .15s;
  }
  .text-input:focus { border-color: var(--copper); box-shadow: 0 0 0 3px var(--copper-ghost) }
  .text-input.err-border { border-color: #c0392b }
  .text-input.narrow { width: 180px }

  .hint { font-family: var(--mono); font-size: 12px; color: var(--faint); margin: 6px 0 0 }
  .err { font-family: var(--mono); font-size: 12px; color: #e74c3c; margin: 6px 0 0 }

  .summary-section {
    background: var(--card); border: 1px solid var(--line); border-radius: 9px; padding: 20px 22px;
  }
  .connect-prompt { font-family: var(--mono); font-size: 13px; color: var(--dim); margin: 0 0 12px }
  .ready-prompt { font-family: var(--mono); font-size: 13px; color: var(--patina); margin: 0 0 12px }
  .connect-link { color: var(--copper); cursor: pointer; text-decoration: underline }
  .connect-link:hover { color: var(--copper2) }
  .cli-block {
    background: var(--bg); border: 1px solid var(--line); border-radius: 7px;
    padding: 12px 16px; margin: 0; overflow-x: auto;
    font-family: var(--mono); font-size: 13px; color: var(--patina);
    white-space: pre; user-select: all;
  }

  @media (max-width: 560px) {
    .text-input.narrow { width: 100% }
  }
</style>

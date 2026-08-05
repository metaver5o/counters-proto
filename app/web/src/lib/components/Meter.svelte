<script lang="ts">
  const { value, digitClass = '', sepClass = '' }: {
    value: number
    digitClass?: string
    sepClass?: string
  } = $props()

  const formatted = $derived(value.toLocaleString('en-US'))
</script>

<span class="meter">
  {#each [...formatted] as ch}
    {#if ch === ','}
      <span class="sep {sepClass}">,</span>
    {:else}
      <span class="d {digitClass}">{ch}</span>
    {/if}
  {/each}
</span>

<style>
  .meter { display: inline-flex; gap: 4px; align-items: stretch }
  .meter .d {
    font-family: var(--mono);
    font-weight: 600;
    background: linear-gradient(#211c15, #171309);
    border: 1px solid var(--line);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 1px 0 #3a2f22, inset 0 -6px 10px #0007;
    color: var(--copper2);
  }
  .meter .sep {
    display: flex;
    align-items: flex-end;
    color: var(--faint);
    font-family: var(--mono);
    font-weight: 600;
    padding-bottom: .12em;
  }
</style>

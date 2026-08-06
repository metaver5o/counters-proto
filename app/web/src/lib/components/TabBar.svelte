<script lang="ts">
  type Tab = 'all' | 'images' | 'text' | 'other'

  const { active, onSelect }: { active: Tab; onSelect: (tab: Tab) => void } = $props()

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'images', label: 'Images' },
    { id: 'text', label: 'Text' },
    { id: 'other', label: 'Other' },
  ]
</script>

<div class="tabbar" role="tablist">
  {#each tabs as tab}
    <button
      role="tab"
      aria-selected={tab.id === active}
      class="tab"
      class:on={tab.id === active}
      onclick={() => onSelect(tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</div>

<style>
  .tabbar {
    display: flex;
    gap: 4px;
    margin-bottom: 18px;
  }
  .tab {
    font-family: var(--mono);
    font-size: 12.5px;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--dim);
    background: none;
    border: 1px solid transparent;
    border-radius: 7px;
    padding: 6px 13px;
    cursor: pointer;
    transition: .15s;
  }
  .tab:hover { color: var(--ink); background: var(--card) }
  .tab.on { color: var(--copper); border-color: var(--copper-ghost) }
</style>

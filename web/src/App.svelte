<script lang="ts">
  import { routeState, syncRoute } from './lib/router.svelte.js'
  import Header from './lib/components/Header.svelte'
  import Footer from './lib/components/Footer.svelte'
  import WalletModal from './lib/components/WalletModal.svelte'
  import Home from './routes/Home.svelte'
  import CounterDetail from './routes/CounterDetail.svelte'
  import BlockView from './routes/BlockView.svelte'
  import Docs from './routes/Docs.svelte'
  let walletModalOpen = $state(false)

  // Sync route on hashchange and browser back/forward
  $effect(() => {
    syncRoute()
    const handle = () => syncRoute()
    window.addEventListener('hashchange', handle)
    window.addEventListener('popstate', handle)
    return () => {
      window.removeEventListener('hashchange', handle)
      window.removeEventListener('popstate', handle)
    }
  })

  // Derive typed route params to avoid discriminated union narrowing issues in templates
  const homeRoute = $derived(routeState.current.view === 'home' ? routeState.current : null)
  const detailRoute = $derived(routeState.current.view === 'detail' ? routeState.current : null)
  const blockRoute = $derived(routeState.current.view === 'block' ? routeState.current : null)
</script>

<Header />

<main>
  {#if homeRoute}
    <Home page={homeRoute.page} />
  {:else if detailRoute}
    <CounterDetail id={detailRoute.id} />
  {:else if blockRoute}
    <BlockView height={blockRoute.height} />
  {:else}
    <Docs />
  {/if}
</main>

<Footer />

<WalletModal bind:modalOpen={walletModalOpen} />

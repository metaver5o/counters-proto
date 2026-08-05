<script lang="ts">
  let html = $state('')
  let toc = $state('')
  let loaded = $state(false)
  let failed = $state(false)

  function escMd(s: string): string {
    return s.replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m] ?? m))
  }

  function inline(s: string): string {
    return escMd(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) =>
        `<a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener" class="out"' : ''}>${t}</a>`)
  }

  function mdToHtml(md: string): { html: string; toc: string } {
    const out: string[] = []
    const tocLinks: string[] = []
    let para: string[] = []
    let list: [string, string][] | null = null
    let quote: string[] = []
    let fence: string[] | null = null
    let table: string[] | null = null

    const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = [] } }
    const flushList = () => {
      if (list) {
        out.push('<ul>' + list.map(([n, t]) => `<li data-n="${n}">${inline(t)}</li>`).join('') + '</ul>')
        list = null
      }
    }
    const flushQuote = () => { if (quote.length) { out.push(`<div class="callout">${inline(quote.join(' '))}</div>`); quote = [] } }
    const flushTable = () => {
      if (!table) return
      if (table.length >= 2 && table[1].includes('-') && /^[\s:|-]+$/.test(table[1])) {
        const cells = (r: string) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
        const head = '<tr>' + cells(table[0]).map((c) => `<th>${inline(c)}</th>`).join('') + '</tr>'
        const body = table.slice(2).map((r) => '<tr>' + cells(r).map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('')
        out.push(`<div class="tablewrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>`)
      } else {
        table.forEach((r) => out.push(`<p>${inline(r)}</p>`))
      }
      table = null
    }
    const flushAll = () => { flushPara(); flushList(); flushQuote(); flushTable() }

    for (const line of md.replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
      if (fence !== null) {
        if (/^```/.test(line)) { out.push('<pre>' + fence.join('\n') + '</pre>'); fence = null }
        else fence.push(escMd(line).replace(/(#.*)$/, '<span class="c">$1</span>'))
        continue
      }
      let m: RegExpMatchArray | null
      if (/^```/.test(line)) { flushAll(); fence = [] }
      else if (/^\s*\|.*\|\s*$/.test(line)) { flushPara(); flushList(); flushQuote(); table = table ?? []; table.push(line) }
      else if ((m = line.match(/^##\s+(.+?)(?:\s*\{#([\w-]+)\})?\s*$/))) {
        flushAll()
        const id = m[2] || m[1].toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')
        tocLinks.push(`<a href="#/docs#${id}">${inline(m[1])}</a>`)
        out.push(`<h2 id="${id}">${inline(m[1])}</h2>`)
      } else if ((m = line.match(/^###\s+(.+)$/))) { flushAll(); out.push(`<h3>${inline(m[1])}</h3>`) }
      else if ((m = line.match(/^>\s?(.*)$/))) { flushPara(); flushList(); flushTable(); if (m[1]) quote.push(m[1]) }
      else if ((m = line.match(/^(\d+)\.\s+(.+)$/))) { flushPara(); flushQuote(); flushTable(); list = list ?? []; list.push([m[1], m[2]]) }
      else if ((m = line.match(/^-\s+(.+)$/))) { flushPara(); flushQuote(); flushTable(); list = list ?? []; list.push(['›', m[1]]) }
      else if (/^\s{2,}\S/.test(line) && list) { list[list.length - 1][1] += ' ' + line.trim() }
      else if (!line.trim()) { flushAll() }
      else { flushList(); flushQuote(); flushTable(); para.push(line.trim()) }
    }
    flushAll()
    if (fence !== null) out.push('<pre>' + fence.join('\n') + '</pre>')
    return { html: out.join('\n'), toc: tocLinks.join('') }
  }

  async function loadDocs() {
    try {
      const r = await fetch('/docs.md')
      if (!r.ok) throw new Error(String(r.status))
      const result = mdToHtml(await r.text())
      html = result.html
      toc = result.toc
      loaded = true
    } catch {
      failed = true
    }
  }

  $effect(() => {
    if (!loaded && !failed) loadDocs()
  })
</script>

{#if failed}
  <div class="wrap docs">
    <div class="empty">
      <b>Docs unavailable</b>
      Serve the explorer with <code>counters server</code> to read the docs.
    </div>
  </div>
{:else if !loaded}
  <div class="wrap docs">
    <div class="empty"><b>Loading…</b></div>
  </div>
{:else}
  <div class="wrap docs">
    <details class="toc">
      <summary>Contents</summary>
      <nav class="toclist">{@html toc}</nav>
    </details>
    <div class="doc">
      <article>{@html html}</article>
    </div>
  </div>
{/if}

<style>
  .docs { display: flex; flex-direction: column; gap: 18px; padding-top: 22px; padding-bottom: 70px }
  .doc { min-width: 0; overflow-wrap: break-word }
  .doc :global(article) { max-width: none }

  .toc { font-family: var(--mono); font-size: 13px; border: 1px solid var(--line2); border-radius: 11px; background: var(--card) }
  .toc > summary { list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; color: var(--dim); font-size: 12px; letter-spacing: .1em; text-transform: uppercase }
  .toc > summary::-webkit-details-marker { display: none }
  .toc > summary::after { content: '▾'; color: var(--faint); transition: transform .2s }
  .toc[open] > summary::after { transform: rotate(180deg) }
  .toclist { display: flex; flex-wrap: wrap; gap: 8px 16px; padding: 0 16px 14px }
  .toclist :global(a) { color: var(--dim); transition: .15s }
  .toclist :global(a:hover), .toclist :global(a.on) { color: var(--copper) }

  .doc :global(h2) { font-family: var(--mono); font-weight: 600; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: var(--copper); margin: 34px 0 12px; padding-top: 8px }
  .doc :global(h2:first-child) { margin-top: 0 }
  .doc :global(h3) { font-family: var(--mono); font-weight: 600; font-size: 16.5px; margin: 24px 0 8px }
  .doc :global(p) { color: var(--dim); margin: 0 0 16px; font-size: 16px; line-height: 1.75 }
  .doc :global(strong), .doc :global(b) { color: var(--ink); font-weight: 600 }
  .doc :global(code) { font-family: var(--mono); font-size: .86em; background: var(--bg2); border: 1px solid var(--line2); border-radius: 5px; padding: 1px 6px; color: var(--copper2) }
  .doc :global(pre) { font-family: var(--mono); font-size: 12.5px; line-height: 1.65; background: #100d09; border: 1px solid var(--line); border-radius: 11px; padding: 16px 18px; overflow-x: auto; color: #d8cdbb; margin: 0 0 18px }
  .doc :global(pre .c) { color: var(--faint) }
  .doc :global(ul) { color: var(--dim); margin: 0 0 16px; padding-left: 0; list-style: none }
  .doc :global(ul li) { padding-left: 24px; position: relative; margin-bottom: 11px; font-size: 16px; line-height: 1.75 }
  .doc :global(ul li)::before { content: attr(data-n); position: absolute; left: 0; font-family: var(--mono); font-size: 11px; color: var(--copper); top: .18em }
  .doc :global(.tablewrap) { overflow-x: auto; margin: 0 0 18px }
  .doc :global(table) { border-collapse: collapse; width: 100%; font-size: 13px }
  .doc :global(th), .doc :global(td) { border: 1px solid var(--line2); padding: 8px 12px; text-align: left; vertical-align: top }
  .doc :global(th) { font-family: var(--mono); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--faint); font-weight: 500; background: var(--bg2); white-space: nowrap }
  .doc :global(td) { color: var(--dim) }
  .doc :global(tbody tr:first-child td) { color: var(--ink) }
  .doc :global(.callout) { background: var(--card); border-left: 2px solid var(--patina); border-radius: 0 10px 10px 0; padding: 14px 16px; margin: 0 0 18px; color: var(--dim); font-size: 15px }
  .doc :global(.callout b) { color: var(--patina) }
  .doc :global(.out) { display: inline-flex; align-items: center; gap: 4px }

  @media (min-width: 861px) {
    .docs { flex-direction: row; gap: 46px; padding-top: 34px; padding-bottom: 90px }
    .doc { flex: 1 }
    .doc :global(article) { max-width: 62ch }
    .doc :global(p), .doc :global(ul li) { font-size: 15px; line-height: 1.6 }
    .doc :global(ul li) { margin-bottom: 9px }
    .doc :global(h2) { margin: 46px 0 14px }
    .doc :global(h3) { font-size: 15px; margin: 26px 0 8px }
    .doc :global(.callout) { font-size: 14px; padding: 13px 18px }
    .toc { flex: 0 0 200px; position: sticky; top: 84px; border: 0; background: none; border-radius: 0 }
    .toc > summary { padding: 0; margin-bottom: 12px; pointer-events: none; color: var(--faint); letter-spacing: .16em; font-size: 11px }
    .toc > summary::after { content: none }
    .toclist { display: block; padding: 0 }
    .toclist :global(a) { display: block; padding: 5px 0 5px 14px; border-left: 1px solid var(--line); margin-left: -1px }
    .toclist :global(a:hover), .toclist :global(a.on) { border-color: var(--copper) }
  }
</style>

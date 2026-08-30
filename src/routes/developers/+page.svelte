<script lang="ts">
  import { Braces, Check, Copy, ExternalLink, KeyRound, ShieldCheck, Terminal } from 'lucide-svelte';
  let copied = $state('');

  const endpoints = [
    { method: 'GET', path: '/api/v1/state', purpose: 'Current shared event state, program, pulse, minions, and Hermes recommendation.' },
    { method: 'GET', path: '/api/v1/scenarios', purpose: 'Bounded rehearsal scenarios supported by the conductor.' },
    { method: 'POST', path: '/api/v1/state', purpose: 'Inject scenario, approve recovery, claim crew task, or reset rehearsal.' },
    { method: 'POST', path: '/api/v1/ask', purpose: 'Ask deterministic operational questions over current event Reality.' },
    { method: 'GET', path: '/api/v1/events', purpose: 'Machine-readable flight recorder for replay and proof.' },
    { method: 'POST', path: '/api/v1/agents/connect', purpose: 'Organizer creates a scoped one-time credential for any compatible agent runtime.' },
    { method: 'GET', path: '/api/v1/agents/context', purpose: 'Bearer-authenticated event briefing and role-scoped work queue.' },
    { method: 'GET', path: '/api/v1/health', purpose: 'Runtime and D1 binding health.' }
  ];

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    copied = value;
    setTimeout(() => copied = '', 1200);
  }
</script>

<svelte:head><title>Agent API | ZAOstock Live Command</title><meta name="description" content="Open, bounded endpoints for agents and community builders to read ZAOstock event state and participate safely." /></svelte:head>

<div class="developers-page">
  <section class="developers-hero">
    <div><p class="eyebrow">AGENTS + COMMUNITY BUILDERS</p><h1>Build on the live event.</h1><p>Read one shared event Reality. Create bounded contributions. Never let an external agent silently rewrite the critical run-of-show.</p></div>
    <div class="api-stamp"><Braces size={34} /><strong>API v1</strong><span>JSON · D1 · CORS</span></div>
  </section>

  <section class="authority-band">
    <article><span>01</span><div><strong>Observe</strong><p>Program, pulse, status, events</p></div><Check size={20} /></article>
    <article><span>02</span><div><strong>Act reversibly</strong><p>Claim tasks, notify, rehearse</p></div><Check size={20} /></article>
    <article><span>03</span><div><strong>Human gate</strong><p>Critical schedule and public effects</p></div><ShieldCheck size={20} /></article>
  </section>

  <div class="developer-grid">
    <section class="endpoint-list">
      <header><Terminal size={21} /><h2>Endpoints</h2><a href="/api/openapi.json" target="_blank">OpenAPI <ExternalLink size={15} /></a></header>
      {#each endpoints as endpoint}
        <article>
          <span class:post={endpoint.method === 'POST'}>{endpoint.method}</span>
          <code>{endpoint.path}</code>
          <p>{endpoint.purpose}</p>
          <button aria-label={`Copy ${endpoint.path}`} onclick={() => copy(endpoint.path)}>
            {#if copied === endpoint.path}<Check size={17} />{:else}<Copy size={17} />{/if}
          </button>
        </article>
      {/each}
    </section>

    <aside class="quickstart-panel">
      <header><KeyRound size={20} /><h2>Agent quickstart</h2></header>
      <p>No credential is needed for public read-only state. Organizer writes require a team session; agent work uses a scoped bearer token created in Connect.</p>
      <pre><code>curl https://your-domain/api/v1/state

curl -X POST /api/v1/ask \
  -H "content-type: application/json" \
  -d '&#123;"question":"Are we ready for WaveWarZ?"&#125;'</code></pre>
      <a class="command-button red" href="/connect">Connect an agent <ExternalLink size={18} /></a>
    </aside>
  </div>
</div>

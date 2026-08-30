<script lang="ts">
  import { onMount } from 'svelte';
  import { Bot, Check, Clipboard, KeyRound, PlugZap, ShieldCheck, Sparkles } from 'lucide-svelte';

  const presets = [
    { name: 'ZOE', runtime: 'ZAO AGENT', capability: 'CREW', note: 'Shared event context + bounded crew work' },
    { name: 'ZABAL Bot', runtime: 'DISCORD / FARCASTER', capability: 'OBSERVER', note: 'Read pulse, program, work, and risks' },
    { name: 'Zaal Agent', runtime: 'CUSTOM', capability: 'OBSERVER', note: 'Organizer-facing command context' },
    { name: 'Signal', runtime: 'ZAOSTOCK', capability: 'MARKETING', note: 'Draft from the real lineup; never auto-post' }
  ];
  let selected = $state(presets[0]);
  let customName = $state('');
  let token = $state('');
  let config = $state('');
  let message = $state('');
  let isOrganizer = $state(false);
  let busy = $state(false);

  onMount(async () => {
    const response = await fetch('/api/v1/team/session');
    if (response.ok) isOrganizer = Boolean((await response.json()).member);
  });

  async function connect() {
    busy = true;
    message = '';
    try {
      const response = await fetch('/api/v1/agents/connect', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: customName.trim() || selected.name, runtime: selected.runtime, capability: selected.capability })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Connection failed');
      token = payload.credential.token;
      config = JSON.stringify({
        name: payload.connection.name,
        baseUrl: payload.agentConfig.baseUrl,
        contextUrl: payload.agentConfig.context,
        authorization: `Bearer ${token}`,
        instruction: 'Read context first. Work only inside granted scopes. Leave proof. Never publish or spend without explicit authority.'
      }, null, 2);
      message = `${payload.connection.name} now has bounded access. The token is shown once.`;
    } catch (error) {
      message = error instanceof Error ? error.message : 'Connection failed';
    } finally { busy = false; }
  }
</script>

<svelte:head><title>Connect an agent | ZAOstock</title><meta name="description" content="Hand ZAOstock Live Command to ZOE, ZABAL Bot, Zaal's agent, or another bounded operator." /></svelte:head>

<div class="workspace-page connect-page">
  <section class="workspace-titlebar connect-hero">
    <div><p class="eyebrow">AGENT HANDOFF / FIRST STEP</p><h1>Put your agent on the crew.</h1><p>Connect ZOE, ZABAL Bot, Zaal's operator, or a custom agent to one shared event Reality. They receive context and bounded work, not the keys to the festival.</p></div>
    <div class="handoff-diagram"><span>ZAAL</span><strong>→</strong><span class="agent-node">ZOE</span><strong>→</strong><span>ZAO TEAM</span></div>
  </section>

  {#if !isOrganizer}<aside class="access-callout"><KeyRound size={22} /><div><strong>Organizer access required</strong><p>Sign in once, then create agent credentials and share role-scoped team invites.</p></div><a href="/team" class="command-button red">Open team access</a></aside>{/if}

  <section class="connect-grid">
    <div class="preset-panel">
      <header><PlugZap size={22} /><div><p class="eyebrow">CHOOSE A BODY</p><h2>Who are you handing it to?</h2></div></header>
      {#each presets as preset}
        <button class:selected={selected.name === preset.name} onclick={() => selected = preset}>
          <Bot size={21} /><span><strong>{preset.name}</strong><small>{preset.runtime} · {preset.note}</small></span>{#if selected.name === preset.name}<Check size={19} />{/if}
        </button>
      {/each}
      <label>Or name a custom agent<input bind:value={customName} placeholder="Agent name" /></label>
      <button class="command-button red" onclick={connect} disabled={!isOrganizer || busy}><Sparkles size={18} /> {busy ? 'Connecting…' : `Connect ${customName || selected.name}`}</button>
    </div>
    <div class="authority-card">
      <ShieldCheck size={34} />
      <p class="eyebrow">AUTHORITY ENVELOPE</p><h2>{selected.capability}</h2>
      <ul><li>Read live event context</li><li>See assigned work and risks</li><li>Use only role-specific write scopes</li><li>No external publishing</li><li>No critical schedule changes</li><li>No money movement</li></ul>
    </div>
  </section>

  {#if message}<p class="workspace-message">{message}</p>{/if}
  {#if token}
    <section class="credential-sheet"><header><KeyRound size={21} /><div><p class="eyebrow">SHOWN ONCE</p><h2>Agent handoff packet</h2></div><button onclick={() => navigator.clipboard.writeText(config)}><Clipboard size={18} /> Copy</button></header><pre>{config}</pre><p>Store this in the agent's secret manager. It is not retrievable from the app later.</p></section>
  {/if}
</div>

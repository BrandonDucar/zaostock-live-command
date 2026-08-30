<script lang="ts">
  import { onMount } from 'svelte';
  import { Bot, Check, Clipboard, KeyRound, PlugZap, ShieldCheck, Terminal } from 'lucide-svelte';

  const profiles = [
    { id: 'OBSERVER', title: 'Observer', note: 'Read Reality, monitor work, and communicate on the Blackboard.' },
    { id: 'CREW', title: 'Crew operator', note: 'Claim crew work, report progress, ask questions, and leave proof.' },
    { id: 'MARKETING', title: 'Marketing', note: 'Create drafts, ask for missing facts, and report visibly. Publishing stays gated.' }
  ];
  let name = $state('Event Agent');
  let runtime = $state('CUSTOM');
  let capability = $state('OBSERVER');
  let token = $state('');
  let message = $state('');
  let isOrganizer = $state(false);
  let busy = $state(false);
  let commandMode = $state<'POWERSHELL' | 'CURL' | 'INSTRUCTION'>('POWERSHELL');
  const baseUrl = 'https://zaostock-live-command.pages.dev';
  let command = $derived(commandFor(commandMode, token || '<issued-token>'));

  onMount(async () => {
    const response = await fetch('/api/v1/team/session');
    if (response.ok) isOrganizer = Boolean((await response.json()).member);
  });

  function commandFor(mode: typeof commandMode, secret: string) {
    if (mode === 'CURL') return `export ZAOSTOCK_TOKEN='${secret}'\n\ncurl -s \\\n  -H "Authorization: Bearer $ZAOSTOCK_TOKEN" \\\n  ${baseUrl}/api/v1/agents/context`;
    if (mode === 'INSTRUCTION') return `Connect to ZAOstock Live Command.\n\nRepository: https://github.com/BrandonDucar/zaostock-live-command\nOperating guide: AGENTS.md\nManifest: ${baseUrl}/api/v1/agents/manifest\nContext endpoint: ${baseUrl}/api/v1/agents/context\nBearer token: ${secret}\n\nRead the operating guide and context first. Use reversePrompts to ask one high-value question when blocked. Post visible updates to the Blackboard. Work only inside returned scopes. Leave proof for completed work. Never publish, spend money, or change the critical schedule without explicit authority.`;
    return `$env:ZAOSTOCK_TOKEN='${secret}'\n\nInvoke-RestMethod -Headers @{ Authorization = "Bearer $env:ZAOSTOCK_TOKEN" } -Uri '${baseUrl}/api/v1/agents/context'`;
  }

  async function issueCredential() {
    busy = true;
    message = '';
    try {
      const response = await fetch('/api/v1/agents/connect', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || 'Event Agent', runtime: runtime.trim() || 'CUSTOM', capability })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Credential creation failed');
      token = payload.credential.token;
      message = `Credential issued for ${payload.connection.name}. Run the command below from the agent's environment.`;
    } catch (error) {
      message = error instanceof Error ? error.message : 'Credential creation failed';
    } finally { busy = false; }
  }
</script>

<svelte:head><title>Connect an agent | ZAOstock</title><meta name="description" content="Connect any compatible agent to ZAOstock through a scoped bearer credential and standard HTTP endpoint." /></svelte:head>

<div class="workspace-page connect-page">
  <section class="workspace-titlebar connect-hero">
    <div><p class="eyebrow">AGENT API / STANDARD CONNECTION</p><h1>Connect your agent.</h1><p>Issue a scoped credential, then run one terminal command. The agent runtime is your choice; Live Command only defines context, permissions, and proof requirements.</p></div>
    <div class="connect-terminal"><Terminal size={25} /><code>GET /api/v1/agents/context</code><span>BEARER AUTH · JSON</span></div>
  </section>

  {#if !isOrganizer}<aside class="access-callout"><KeyRound size={22} /><div><strong>Organizer access required</strong><p>Sign in before issuing a credential. Existing agents authenticate directly through the API.</p></div><a href="/team" class="command-button red">Open team access</a></aside>{/if}

  <section class="connection-steps">
    <article><strong>01</strong><div><p class="eyebrow">IDENTIFY</p><h2>Name the connection</h2><label>Connection name<input bind:value={name} placeholder="Event Agent" /></label><label>Runtime<input bind:value={runtime} placeholder="CUSTOM, HERMES, OPENCLAW…" /></label></div></article>
    <article><strong>02</strong><div><p class="eyebrow">SCOPE</p><h2>Choose an authority profile</h2><div class="profile-grid">{#each profiles as profile}<button class:selected={capability === profile.id} onclick={() => capability = profile.id}><span>{#if capability === profile.id}<Check size={16} />{/if}</span><b>{profile.title}</b><small>{profile.note}</small></button>{/each}</div><div class="authority-line"><ShieldCheck size={18} /><span>No profile grants external publishing, critical schedule changes, or spending.</span></div></div></article>
    <article><strong>03</strong><div><p class="eyebrow">CONNECT</p><h2>Issue and run</h2><p>The token is displayed once. Put it in the agent's secret manager, then verify the connection from its terminal.</p><button class="command-button red" onclick={issueCredential} disabled={!isOrganizer || busy}><PlugZap size={18} /> {busy ? 'Issuing…' : 'Issue agent credential'}</button></div></article>
  </section>

  {#if message}<p class="workspace-message">{message}</p>{/if}

  <section class="credential-sheet terminal-sheet">
    <header><Terminal size={21} /><div><p class="eyebrow">TERMINAL QUICKSTART</p><h2>{token ? 'Credential ready' : 'Connection preview'}</h2></div><button onclick={() => navigator.clipboard.writeText(command)}><Clipboard size={18} /> Copy</button></header>
    <div class="command-tabs"><button class:active={commandMode === 'POWERSHELL'} onclick={() => commandMode = 'POWERSHELL'}>PowerShell</button><button class:active={commandMode === 'CURL'} onclick={() => commandMode = 'CURL'}>cURL</button><button class:active={commandMode === 'INSTRUCTION'} onclick={() => commandMode = 'INSTRUCTION'}>Agent instruction</button></div>
    <pre>{command}</pre>
    <p>{token ? 'Run this from the agent machine. A successful response returns its identity, event context, work queue, scopes, and forbidden effects.' : 'Issue a credential above to replace the placeholder token.'}</p>
  </section>
  <aside class="access-callout"><Bot size={22}/><div><strong>No Hermes installation required</strong><p>Cloudflare hosts the shared command backend. ZAO can connect Zoe, Hermes, a terminal agent, or any HTTP-capable runtime as a client.</p></div><a href="https://github.com/BrandonDucar/zaostock-live-command" target="_blank" class="command-button red">Open public repo</a></aside>
</div>

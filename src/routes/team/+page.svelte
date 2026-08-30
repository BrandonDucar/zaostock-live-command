<script lang="ts">
  import { onMount } from 'svelte';
  import { BadgeCheck, Clipboard, KeyRound, LogIn, Plus, Share2, ShieldCheck, Users } from 'lucide-svelte';

  type Member = { id: string; name: string; role: string; createdAt?: string };
  type FarcasterProfile = { fid: number; username?: string; displayName?: string };

  let current = $state<Member | null>(null);
  let members = $state<Member[]>([]);
  let name = $state('Zaal');
  let code = $state('');
  let role = $state('ADMIN');
  let inviteUrl = $state('');
  let message = $state('');
  let busy = $state(false);
  let farcasterBusy = $state(false);
  let farcasterProfile = $state<FarcasterProfile | null>(null);
  let canInvite = $derived(Boolean(current && ['OWNER', 'ADMIN'].includes(current.role)));

  onMount(() => {
    void load();
    void detectFarcaster();
  });

  async function load() {
    const session = await fetch('/api/v1/team/session');
    if (session.ok) current = (await session.json()).member;
    if (current && ['OWNER', 'ADMIN'].includes(current.role)) {
      const response = await fetch('/api/v1/team/invites');
      if (response.ok) members = (await response.json()).members;
    }
  }

  async function detectFarcaster() {
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk');
      if (!await sdk.isInMiniApp()) return;
      const context = await sdk.context;
      farcasterProfile = context.user;
    } catch {
      farcasterProfile = null;
    }
  }

  async function joinWithFarcaster() {
    if (!farcasterProfile) return;
    farcasterBusy = true;
    message = '';
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk');
      const response = await sdk.quickAuth.fetch('/api/v1/auth/farcaster', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: farcasterProfile.displayName || farcasterProfile.username || `Farcaster ${farcasterProfile.fid}` })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Farcaster sign-in failed');
      current = payload.member;
      window.dispatchEvent(new CustomEvent('zaostock:session-changed'));
      message = `Signed in as ${payload.member.name}. Your ${payload.member.role.toLowerCase()} authority remains server-enforced.`;
      await load();
    } catch (error) {
      message = error instanceof Error ? error.message : 'Farcaster sign-in failed';
    } finally {
      farcasterBusy = false;
    }
  }

  async function bootstrap() {
    busy = true;
    try {
      const response = await fetch('/api/v1/team/bootstrap', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, code })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      current = payload.member;
      code = '';
      window.dispatchEvent(new CustomEvent('zaostock:session-changed'));
      await load();
    } catch (error) {
      message = error instanceof Error ? error.message : 'Access failed';
    } finally {
      busy = false;
    }
  }

  async function invite() {
    busy = true;
    try {
      const response = await fetch('/api/v1/team/invites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      inviteUrl = payload.inviteUrl;
      message = `One-time ${role.replace('_', ' ').toLowerCase()} invite created.`;
    } catch (error) {
      message = error instanceof Error ? error.message : 'Invite failed';
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head>
  <title>Team access | ZAOstock</title>
  <meta name="description" content="Join ZAOstock through Farcaster or a role-scoped team invitation without sharing owner credentials." />
  <link rel="preconnect" href="https://auth.farcaster.xyz" />
</svelte:head>

<div class="workspace-page team-page">
  <section class="workspace-titlebar">
    <div><p class="eyebrow">TEAM ACCESS / ZAO HANDOFF</p><h1>Share the room, not the master key.</h1><p>Community, staff, and agents enter through different identity paths. Authority remains explicit after sign-in.</p></div>
    <Share2 size={56} />
  </section>

  {#if !current}
    <section class="onboarding-grid">
      <article class="farcaster-access" class:available={Boolean(farcasterProfile)}>
        <BadgeCheck size={34} />
        <div><p class="eyebrow">FARCASTER QUICK AUTH</p><h2>{farcasterProfile ? `Continue as ${farcasterProfile.displayName || farcasterProfile.username || `FID ${farcasterProfile.fid}`}` : 'Open inside Farcaster'}</h2><p>{farcasterProfile ? 'One tap creates a verified, read-only observer session. Operational authority still requires an explicit role.' : 'Farcaster users receive seamless identity when this Mini App is opened inside a compatible client.'}</p></div>
        {#if farcasterProfile}<button class="command-button ink" onclick={joinWithFarcaster} disabled={farcasterBusy}><LogIn size={18} /> {farcasterBusy ? 'Verifying…' : 'Continue with Farcaster'}</button>{/if}
      </article>

      <section class="owner-access">
        <KeyRound size={38} />
        <div><p class="eyebrow">OWNER BOOTSTRAP</p><h2>Enter the private organizer code</h2><p>Use this only for the event owner. Staff should join through role-specific invitations.</p></div>
        <label>Your name<input bind:value={name} /></label>
        <label>Organizer code<input type="password" bind:value={code} /></label>
        <button class="command-button red" onclick={bootstrap} disabled={busy}>Enter command</button>
      </section>
    </section>
  {:else}
    <section class="team-console">
      <header><ShieldCheck size={24} /><div><p class="eyebrow">SIGNED IN</p><h2>{current.name} · {current.role.replace('_', ' ')}</h2></div></header>
      {#if canInvite}
        <div class="invite-builder"><label>Access role<select bind:value={role}><option>ADMIN</option><option>STAGE_MANAGER</option><option>CREW_LEAD</option><option>MARKETING</option></select></label><button class="command-button red" onclick={invite} disabled={busy}><Plus size={17} /> Create one-time invite</button></div>
        {#if inviteUrl}<div class="invite-result"><code>{inviteUrl}</code><button onclick={() => navigator.clipboard.writeText(inviteUrl)}><Clipboard size={17} /> Copy</button></div>{/if}
      {:else}
        <div class="role-boundary"><ShieldCheck size={20} /><div><strong>Your identity is verified.</strong><p>Your current role cannot create invitations or change event operations. An owner or admin can issue a role-scoped invite if you are joining the working crew.</p></div></div>
      {/if}
    </section>

    {#if canInvite}
      <section class="member-list"><header><Users size={21} /><div><p class="eyebrow">ZAO TEAM</p><h2>People with access</h2></div></header>{#each members as member}<article><span>{member.name.slice(0,2).toUpperCase()}</span><div><strong>{member.name}</strong><small>{member.role.replace('_',' ')}</small></div></article>{/each}</section>
    {/if}
  {/if}

  {#if message}<p class="workspace-message">{message}</p>{/if}
</div>

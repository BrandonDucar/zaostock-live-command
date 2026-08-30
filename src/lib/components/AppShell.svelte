<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { BookOpen, Bot, CalendarRange, Command, Ellipsis, Eye, KeyRound, ListChecks, Megaphone, MessageSquareText, Radio, RotateCcw, Share2, UserRoundCog, Users } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  type SessionMember = { name: string; role: string };

  let member = $state<SessionMember | null>(null);
  let moreMenu = $state<HTMLDetailsElement | null>(null);
  let moreOpen = $state(false);

  const links = [
    { href: '/', label: 'Command', icon: Command },
    { href: '/program', label: 'Program', icon: CalendarRange },
    { href: '/crew', label: 'Crew', icon: Users },
    { href: '/work', label: 'Work', icon: ListChecks },
    { href: '/blackboard', label: 'Blackboard', icon: MessageSquareText }
  ];

  const moreLinks = [
    { href: '/staff', label: 'Staff', icon: UserRoundCog },
    { href: '/marketing', label: 'Marketing', icon: Megaphone },
    { href: '/crowd', label: 'Crowd', icon: Radio },
    { href: '/connect', label: 'Connect agent', icon: Bot },
    { href: '/team', label: 'Share with team', icon: Share2 },
    { href: '/replay', label: 'Replay', icon: RotateCcw },
    { href: '/developers', label: 'API docs', icon: BookOpen }
  ];

  async function loadSession() {
    try {
      const response = await fetch('/api/v1/team/session');
      member = response.ok ? (await response.json()).member ?? null : null;
    } catch {
      member = null;
    }
  }

  afterNavigate(() => {
    moreOpen = false;
    void loadSession();
  });

  onMount(() => {
    const closeMore = (event: PointerEvent) => {
      if (moreOpen && moreMenu && !moreMenu.contains(event.target as Node)) moreOpen = false;
    };
    const refreshSession = () => void loadSession();
    document.addEventListener('pointerdown', closeMore);
    window.addEventListener('zaostock:session-changed', refreshSession);
    return () => {
      document.removeEventListener('pointerdown', closeMore);
      window.removeEventListener('zaostock:session-changed', refreshSession);
    };
  });
</script>

<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="/" aria-label="ZAOstock Live Command home">
      <span class="brand-mark">Z</span>
      <span>
        <strong>ZAOstock</strong>
        <small>Live Command</small>
      </span>
    </a>

    <nav aria-label="Primary navigation">
      {#each links as link}
        <a href={link.href} class:active={$page.url.pathname === link.href} aria-current={$page.url.pathname === link.href ? 'page' : undefined}>
          <link.icon size={18} strokeWidth={2.4} />
          <span>{link.label}</span>
        </a>
      {/each}
      <details class="more-menu" bind:this={moreMenu} bind:open={moreOpen}>
        <summary class:active={moreLinks.some((link) => $page.url.pathname === link.href)}><Ellipsis size={20} /><span>More</span></summary>
        <div>
          {#each moreLinks as link}
            <a href={link.href} class:active={$page.url.pathname === link.href} onclick={() => moreOpen = false}>
              <link.icon size={17} /> <span>{link.label}</span>
            </a>
          {/each}
        </div>
      </details>
    </nav>

    <div class="operator-state-wrap">
      <a class:authenticated={Boolean(member)} class="operator-state" href="/team" aria-label={member ? `Organizer session active for ${member.name}` : 'Guest mode, open team access'}>
        {#if member}<KeyRound size={15} />{:else}<Eye size={15} />{/if}
        <span><strong>{member ? 'Organizer active' : 'Guest mode'}</strong><small>{member ? `${member.name} · ${member.role.replace('_', ' ')}` : 'Read only'}</small></span>
      </a>
      <div class="date-stamp"><span>OCT 03</span><small>ELLSWORTH, ME</small></div>
    </div>
  </header>

  <main>{@render children()}</main>
</div>

<script lang="ts">
  import { page } from '$app/stores';
  import { BookOpen, Bot, CalendarRange, Command, Ellipsis, ListChecks, Megaphone, Radio, RotateCcw, Share2, UserRoundCog, Users } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const links = [
    { href: '/', label: 'Command', icon: Command },
    { href: '/program', label: 'Program', icon: CalendarRange },
    { href: '/staff', label: 'Staff', icon: UserRoundCog },
    { href: '/work', label: 'Work', icon: ListChecks },
    { href: '/marketing', label: 'Marketing', icon: Megaphone },
    { href: '/crowd', label: 'Crowd', icon: Radio }
  ];

  const moreLinks = [
    { href: '/connect', label: 'Connect agent', icon: Bot },
    { href: '/team', label: 'Share with team', icon: Share2 },
    { href: '/crew', label: 'Crew view', icon: Users },
    { href: '/replay', label: 'Replay', icon: RotateCcw },
    { href: '/developers', label: 'API docs', icon: BookOpen }
  ];
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
      <details class="more-menu">
        <summary class:active={moreLinks.some((link) => $page.url.pathname === link.href)}><Ellipsis size={20} /><span>More</span></summary>
        <div>
          {#each moreLinks as link}
            <a href={link.href} class:active={$page.url.pathname === link.href}>
              <link.icon size={17} /> <span>{link.label}</span>
            </a>
          {/each}
        </div>
      </details>
    </nav>

    <div class="date-stamp">
      <span>OCT 03</span>
      <small>ELLSWORTH, ME</small>
    </div>
  </header>

  <main>{@render children()}</main>
</div>

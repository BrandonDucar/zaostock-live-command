<script lang="ts">
  import { page } from '$app/stores';
  import { BookOpen, Command, Radio, RotateCcw, Users } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const links = [
    { href: '/', label: 'Command', icon: Command },
    { href: '/crowd', label: 'Crowd', icon: Radio },
    { href: '/crew', label: 'Crew', icon: Users },
    { href: '/replay', label: 'Replay', icon: RotateCcw },
    { href: '/developers', label: 'API', icon: BookOpen }
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
    </nav>

    <div class="date-stamp">
      <span>OCT 03</span>
      <small>ATLANTA</small>
    </div>
  </header>

  <main>{@render children()}</main>
</div>


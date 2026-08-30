<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowRight, CalendarDays, HandHelping, Play, Radio, Swords } from 'lucide-svelte';
  import { currentProgram, formatTime } from '$lib/conductor';
  import { eventStore } from '$lib/event-store';

  let programState = $derived(currentProgram($eventStore));
  let battleMode = $derived(programState.now?.kind === 'BATTLE' || programState.next?.kind === 'BATTLE');

  onMount(() => {
    const timer = window.setInterval(() => eventStore.tick(1), 1000);
    return () => window.clearInterval(timer);
  });
</script>

<svelte:head><title>Crowd View | ZAOstock Live Command</title><meta name="description" content="What is happening now at ZAOstock, what is next, and how to participate." /></svelte:head>

<div class="crowd-page">
  <section class="crowd-hero">
    <div class="crowd-brand"><span>Z</span><strong>ZAOstock</strong><small>OCTOBER 03 · ATLANTA</small></div>
    <span class="crowd-live"><i></i> FESTIVAL LIVE</span>

    {#if battleMode}
      <div class="battle-live">
        <p class="eyebrow">WAVEWARZ</p>
        <h1>STILO <span>VS</span> JANGO</h1>
        <p class="voting">VOTING {$eventStore.voteDelayMinutes ? 'EXTENDED' : 'OPEN'} <strong>00:47</strong></p>
        <button class="command-button red"><Swords size={20} /> Vote now</button>
      </div>
    {:else}
      <div class="crowd-now">
        <p class="eyebrow">HAPPENING NOW</p>
        <h1>{programState.now?.title ?? 'ZAOstock is alive'}</h1>
        <p>{programState.now?.venue ?? 'Festival Grounds'}</p>
        <button class="command-button ink"><Play size={20} fill="currentColor" /> Watch live</button>
      </div>
    {/if}

    <div class="crowd-next">
      <span>NEXT</span>
      <div><strong>{programState.next?.title ?? 'Closing celebration'}</strong><small>{programState.next?.venue ?? 'Main Stage'}</small></div>
      <time>{programState.next ? formatTime(programState.next.startMinute) : '--'}</time>
    </div>
  </section>

  <section class="crowd-actions">
    <a href="#program"><CalendarDays size={28} /><div><strong>Program</strong><span>See the full run-of-show</span></div><ArrowRight size={20} /></a>
    <a href="#wavewarz"><Radio size={28} /><div><strong>WaveWarZ</strong><span>Battles, voting, and finals</span></div><ArrowRight size={20} /></a>
    <a href="/crew"><HandHelping size={28} /><div><strong>Help Out</strong><span>Take a live festival task</span></div><ArrowRight size={20} /></a>
  </section>

  <section class="crowd-program" id="program">
    <header><p class="eyebrow">TODAY AT ZAOSTOCK</p><h2>One living program.</h2></header>
    <div>
      {#each $eventStore.program as item}
        <article class:current={item.id === programState.now?.id}>
          <time>{formatTime(item.startMinute)}</time>
          <span>{item.kind}</span>
          <div><strong>{item.title}</strong><small>{item.venue}</small></div>
          {#if item.id === programState.now?.id}<em>NOW</em>{/if}
        </article>
      {/each}
    </div>
  </section>
</div>


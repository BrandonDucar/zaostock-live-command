<script lang="ts">
  import { Activity, ArrowUpRight, CheckCircle2, Clock3, Download, Radio, Users } from 'lucide-svelte';
  import LiveWire from '$lib/components/LiveWire.svelte';
  import { eventStore } from '$lib/event-store';
</script>

<svelte:head><title>Replay | ZAOstock Live Command</title><meta name="description" content="ZAOstock planned-versus-actual replay, interventions, crew contribution, and institutional learning." /></svelte:head>

<div class="replay-page">
  <section class="replay-header">
    <div><p class="eyebrow">EVENT FLIGHT RECORDER</p><h1>ZAOstock Replay</h1><p>Every observation, intervention, human approval, and recovery becomes inspectable event memory.</p></div>
    <button class="command-button ink"><Download size={19} /> Export receipt</button>
  </section>

  <section class="replay-metrics">
    <article><Clock3 size={23} /><span>Largest drift</span><strong>+{$eventStore.scheduleDriftMinutes}m</strong><small>Stage timeline</small></article>
    <article><CheckCircle2 size={23} /><span>Tasks closed</span><strong>{$eventStore.tasks.filter((task) => task.status === 'DONE').length}</strong><small>of {$eventStore.tasks.length}</small></article>
    <article><Users size={23} /><span>Crew present</span><strong>{$eventStore.crew.filter((member) => member.checkedIn).length}</strong><small>of {$eventStore.crew.length}</small></article>
    <article><Radio size={23} /><span>Stream</span><strong>{$eventStore.streamHealthy ? 'UP' : 'DOWN'}</strong><small>current state</small></article>
  </section>

  <div class="replay-grid">
    <LiveWire events={$eventStore.wire} />
    <section class="lessons-panel">
      <header><Activity size={22} /><div><p class="eyebrow">NEXT EVENT INHERITS THIS</p><h2>Candidate lessons</h2></div></header>
      <article><span>01</span><div><strong>Protect the WaveWarZ hard start.</strong><p>Preserve at least eight minutes of recoverable stage buffer before the story block.</p></div><ArrowUpRight size={18} /></article>
      <article><span>02</span><div><strong>Cross-train content coverage.</strong><p>Two checked-in volunteers should match the crowd-arrival capture capability.</p></div><ArrowUpRight size={18} /></article>
      <article><span>03</span><div><strong>Keep the standby stream warm.</strong><p>Rehearsal proves the failover path before the audience needs it.</p></div><ArrowUpRight size={18} /></article>
      <p class="replay-note">These are recommendations, not promoted institutional truth. Real event evidence decides what survives.</p>
    </section>
  </div>
</div>


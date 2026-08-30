<script lang="ts">
  import { CheckCircle2, Clock3, MapPin, Radio, UserCheck, Zap } from 'lucide-svelte';
  import { currentProgram, formatTime } from '$lib/conductor';
  import { eventStore } from '$lib/event-store';

  let name = $state('Alex');
  let programState = $derived(currentProgram($eventStore));

  async function claim(taskId: string) {
    try {
      const response = await fetch('/api/v1/state', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'claim', taskId, name })
      });
      if (response.ok) {
        const payload = await response.json();
        eventStore.hydrate(payload.state);
        return;
      }
    } catch {
      // Local mode remains fully usable during rehearsal.
    }
    eventStore.claim(taskId, name);
  }
</script>

<svelte:head><title>Crew | ZAOstock Live Command</title><meta name="description" content="A focused ZAOstock crew view for check-in, assignments, and bounded Hermes requests." /></svelte:head>

<div class="crew-page">
  <section class="crew-header">
    <div>
      <p class="eyebrow">CONTENT CREW / LIVE ASSIGNMENTS</p>
      <h1>You're checked in.</h1>
      <p>Hermes will only interrupt when your capability matches a real event need.</p>
    </div>
    <div class="crew-identity"><UserCheck size={25} /><label>Your call sign<input bind:value={name} aria-label="Your crew call sign" /></label><span>AVAILABLE</span></div>
  </section>

  <div class="crew-grid">
    <section class="crew-focus">
      <p class="block-label">NOW</p>
      <h2>Photograph {programState.now?.title ?? 'the live program'}</h2>
      <p><MapPin size={18} /> {programState.now?.venue ?? 'Festival Grounds'}</p>
      <div class="assignment-meta"><span><Clock3 size={17} /> Until {programState.next ? formatTime(programState.next.startMinute - 10) : 'close'}</span><span><Radio size={17} /> Upload to event proof</span></div>
    </section>

    <section class="crew-next">
      <p class="block-label">NEXT</p>
      <h2>{programState.next?.title ?? 'Stand by'}</h2>
      <p>{programState.next ? formatTime(programState.next.startMinute - 10) : '--'} · {programState.next?.venue ?? 'Festival Grounds'}</p>
    </section>
  </div>

  <section class="request-board">
    <header><div class="hermes-mark"><Zap size={20} /></div><div><p class="eyebrow">HERMES REQUESTS</p><h2>Useful work near you.</h2></div></header>
    <div class="task-list">
      {#each $eventStore.tasks as task}
        <article class:claimed={task.status !== 'QUEUED'}>
          <div class="task-time"><strong>{formatTime(task.dueMinute)}</strong><small>{task.durationMinutes} MIN</small></div>
          <div class="task-copy"><span>{task.capability}</span><h3>{task.title}</h3><p><MapPin size={16} /> {task.location}</p></div>
          {#if task.status === 'QUEUED'}
            <button class="command-button red" onclick={() => claim(task.id)}>Take it</button>
          {:else}
            <div class="claimed-label"><CheckCircle2 size={19} /><span>{task.status}<small>{task.assignee}</small></span></div>
          {/if}
        </article>
      {/each}
    </div>
  </section>
</div>

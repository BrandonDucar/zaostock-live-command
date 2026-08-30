<script lang="ts">
  import { onMount } from 'svelte';
  import { Check, Clock3, Plus, Save, Search, UserCheck, UserRoundCog } from 'lucide-svelte';
  import { inputToMinute, loadEventState, minuteToInput, mutateEventState } from '$lib/api';
  import { eventStore } from '$lib/event-store';
  import type { CrewMember } from '$lib/types';

  let rows = $state<CrewMember[]>([]);
  let search = $state('');
  let message = $state('');
  let busyId = $state('');
  let filteredRows = $derived(rows.filter((row) => `${row.name} ${row.role} ${row.assignment}`.toLowerCase().includes(search.toLowerCase())));
  let coverage = $derived({
    checkedIn: rows.filter((row) => row.checkedIn).length,
    available: rows.filter((row) => row.checkedIn && row.available).length,
    capabilities: new Set(rows.map((row) => row.capability)).size
  });

  onMount(async () => {
    try {
      const state = await loadEventState();
      eventStore.hydrate(state);
      rows = structuredClone(state.crew);
    } catch (error) {
      message = error instanceof Error ? error.message : 'Could not load staff';
    }
  });

  function addStaff() {
    rows = [...rows, {
      id: `crew-${crypto.randomUUID()}`,
      name: 'New staff member',
      capability: 'GENERAL',
      checkedIn: false,
      available: false,
      role: 'Event Staff',
      shiftStartMinute: 14 * 60,
      shiftEndMinute: 18 * 60,
      assignment: 'Unassigned'
    }];
  }

  async function save(member: CrewMember) {
    busyId = member.id;
    try {
      const state = await mutateEventState({ type: 'crew_save', member });
      eventStore.hydrate(state);
      rows = structuredClone(state.crew);
      message = `${member.name}'s schedule is saved.`;
    } catch (error) {
      message = error instanceof Error ? error.message : 'Save failed';
    } finally {
      busyId = '';
    }
  }

  async function checkIn(member: CrewMember) {
    busyId = member.id;
    try {
      const state = await mutateEventState({ type: 'crew_checkin', id: member.id, checkedIn: !member.checkedIn });
      eventStore.hydrate(state);
      rows = structuredClone(state.crew);
    } catch (error) {
      message = error instanceof Error ? error.message : 'Check-in failed';
    } finally {
      busyId = '';
    }
  }
</script>

<svelte:head><title>Staff | ZAOstock Live Command</title><meta name="description" content="Schedule ZAOstock event staff, assignments, shifts, and live check-ins." /></svelte:head>

<div class="workspace-page staff-page">
  <section class="workspace-titlebar">
    <div><p class="eyebrow">PEOPLE WORKSPACE / EVENT COVERAGE</p><h1>Staff board</h1><p>Schedule the humans who make the event real. Hermes watches coverage and routes bounded requests to checked-in capabilities.</p></div>
    <button class="command-button red" onclick={addStaff}><Plus size={19} /> Add staff</button>
  </section>

  <section class="coverage-band">
    <article><UserCheck size={21} /><span>Checked in<strong>{coverage.checkedIn}/{rows.length}</strong></span></article>
    <article><Check size={21} /><span>Available now<strong>{coverage.available}</strong></span></article>
    <article><UserRoundCog size={21} /><span>Capabilities<strong>{coverage.capabilities}</strong></span></article>
    <article><Clock3 size={21} /><span>Open work<strong>{$eventStore.tasks.filter((task) => !['DONE', 'PROOF'].includes(task.status)).length}</strong></span></article>
  </section>

  <section class="workspace-toolbar">
    <div class="document-title"><UserRoundCog size={19} /><span><strong>Festival staff</strong><small>Roles, shifts, assignment, attendance</small></span></div>
    <div class="sheet-search"><Search size={17} /><input bind:value={search} placeholder="Find staff or assignment" aria-label="Search staff" /></div>
    <a class="view-link" href="/crew">Open crew-facing view</a>
  </section>

  {#if message}<p class="workspace-message">{message}</p>{/if}

  <section class="sheet-shell staff-sheet">
    <div class="sheet-head staff-columns"><span>Name</span><span>Role</span><span>Capability</span><span>Shift starts</span><span>Shift ends</span><span>Assignment</span><span>Live status</span><span>Save</span></div>
    {#each filteredRows as member (member.id)}
      <article class="sheet-row staff-columns">
        <input bind:value={member.name} aria-label="Staff name" />
        <input bind:value={member.role} aria-label={`${member.name} role`} />
        <select bind:value={member.capability} aria-label={`${member.name} capability`}><option>GENERAL</option><option>STAGE</option><option>CONTENT</option><option>MEDIA</option><option>SAFETY</option><option>HOSPITALITY</option><option>WAVEWARZ</option></select>
        <input type="time" value={minuteToInput(member.shiftStartMinute)} onchange={(event) => member.shiftStartMinute = inputToMinute(event.currentTarget.value)} aria-label={`${member.name} shift start`} />
        <input type="time" value={minuteToInput(member.shiftEndMinute)} onchange={(event) => member.shiftEndMinute = inputToMinute(event.currentTarget.value)} aria-label={`${member.name} shift end`} />
        <input bind:value={member.assignment} aria-label={`${member.name} assignment`} />
        <button class:checked-in={member.checkedIn} class="checkin-button" onclick={() => checkIn(member)} disabled={busyId === member.id}>{member.checkedIn ? 'CHECKED IN' : 'NOT HERE'}</button>
        <button class="icon-command" onclick={() => save(member)} title="Save staff row" disabled={busyId === member.id}><Save size={18} /></button>
      </article>
    {/each}
  </section>
</div>

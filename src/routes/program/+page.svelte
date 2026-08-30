<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowDown, ArrowUp, CalendarRange, Check, CopyPlus, Plus, Replace, Save, Search, X } from 'lucide-svelte';
  import { inputToMinute, loadEventState, minuteToInput, mutateEventState } from '$lib/api';
  import { eventStore } from '$lib/event-store';
  import type { ProgramItem } from '$lib/types';

  let rows = $state<ProgramItem[]>([]);
  let search = $state('');
  let busyId = $state('');
  let message = $state('');
  let substitute = $state<ProgramItem | null>(null);
  let replacementTitle = $state('');
  let filteredRows = $derived(rows.filter((row) => row.title.toLowerCase().includes(search.toLowerCase()) || row.venue.toLowerCase().includes(search.toLowerCase())));

  onMount(async () => {
    try {
      const state = await loadEventState();
      eventStore.hydrate(state);
      rows = structuredClone(state.program).sort((a, b) => a.startMinute - b.startMinute);
    } catch (error) {
      message = error instanceof Error ? error.message : 'Could not load lineup';
    }
  });

  async function save(row: ProgramItem) {
    busyId = row.id;
    message = '';
    try {
      const state = await mutateEventState({ type: 'program_save', item: row });
      eventStore.hydrate(state);
      rows = structuredClone(state.program);
      message = `${row.title} saved to the shared run-of-show.`;
    } catch (error) {
      message = error instanceof Error ? error.message : 'Save failed';
    } finally {
      busyId = '';
    }
  }

  async function move(id: string, direction: -1 | 1) {
    busyId = id;
    try {
      const state = await mutateEventState({ type: 'program_move', id, direction });
      eventStore.hydrate(state);
      rows = structuredClone(state.program);
    } catch (error) {
      message = error instanceof Error ? error.message : 'Move failed';
    } finally {
      busyId = '';
    }
  }

  function addAct() {
    rows = [...rows, {
      id: `program-${crypto.randomUUID()}`,
      title: 'New act',
      venue: 'Main Stage',
      startMinute: (rows.at(-1)?.startMinute ?? 14 * 60) + 30,
      durationMinutes: 30,
      kind: 'MUSIC',
      status: 'HOLD',
      notes: 'Confirmation required.'
    }];
  }

  async function confirmSubstitution() {
    if (!substitute || !replacementTitle.trim()) return;
    busyId = substitute.id;
    try {
      const state = await mutateEventState({ type: 'program_substitute', id: substitute.id, title: replacementTitle });
      eventStore.hydrate(state);
      rows = structuredClone(state.program);
      message = `${replacementTitle} is now on HOLD in ${substitute.title}'s slot.`;
      substitute = null;
      replacementTitle = '';
    } catch (error) {
      message = error instanceof Error ? error.message : 'Substitution failed';
    } finally {
      busyId = '';
    }
  }
</script>

<svelte:head><title>Program | ZAOstock Live Command</title><meta name="description" content="Build and edit the ZAOstock run-of-show like a living lineup sheet." /></svelte:head>

{#if substitute}
  <div class="workspace-dialog" role="dialog" aria-modal="true" aria-labelledby="substitute-title">
    <div>
      <button class="dialog-close" onclick={() => substitute = null} aria-label="Close"><X size={20} /></button>
      <p class="eyebrow">LINEUP SUBSTITUTION</p>
      <h2 id="substitute-title">Replace {substitute.title}</h2>
      <p>The time, stage, and downstream assignments stay in place. The replacement begins on HOLD until a human confirms it.</p>
      <label>Replacement act<input bind:value={replacementTitle} placeholder="Artist or program name" /></label>
      <button class="command-button red" onclick={confirmSubstitution}><Replace size={18} /> Substitute act</button>
    </div>
  </div>
{/if}

<div class="workspace-page program-page">
  <section class="workspace-titlebar">
    <div><p class="eyebrow">PROGRAM WORKSPACE / SHARED REALITY</p><h1>Run-of-show</h1><p>Edit the event like a lineup sheet. Command, Crowd, Crew, and Marketing inherit the same saved program.</p></div>
    <button class="command-button red" onclick={addAct}><Plus size={19} /> Add act</button>
  </section>

  <section class="workspace-toolbar">
    <div class="document-title"><CalendarRange size={19} /><span><strong>ZAOstock October 03</strong><small>Program sheet · {$eventStore.program.length} blocks</small></span></div>
    <div class="sheet-search"><Search size={17} /><input bind:value={search} placeholder="Find an act or stage" aria-label="Search program" /></div>
    <span class="autosave-state"><Check size={16} /> D1 SHARED</span>
  </section>

  {#if message}<p class="workspace-message">{message}</p>{/if}

  <section class="sheet-shell">
    <div class="sheet-head program-columns">
      <span>#</span><span>Time</span><span>Act / program</span><span>Stage</span><span>Min</span><span>Type</span><span>Status</span><span>Notes</span><span>Actions</span>
    </div>
    {#each filteredRows as row, index (row.id)}
      <article class="sheet-row program-columns">
        <div class="lineup-position"><strong>{String(index + 1).padStart(2, '0')}</strong><button onclick={() => move(row.id, -1)} aria-label={`Move ${row.title} up`} disabled={index === 0 || busyId === row.id}><ArrowUp size={14} /></button><button onclick={() => move(row.id, 1)} aria-label={`Move ${row.title} down`} disabled={index === filteredRows.length - 1 || busyId === row.id}><ArrowDown size={14} /></button></div>
        <input type="time" value={minuteToInput(row.startMinute)} onchange={(event) => row.startMinute = inputToMinute(event.currentTarget.value)} aria-label={`${row.title} start time`} />
        <input bind:value={row.title} aria-label="Act name" />
        <input bind:value={row.venue} aria-label={`${row.title} stage`} />
        <input class="number-input" type="number" min="5" max="240" bind:value={row.durationMinutes} aria-label={`${row.title} duration`} />
        <select bind:value={row.kind} aria-label={`${row.title} type`}><option>MUSIC</option><option>BATTLE</option><option>STORY</option><option>COMMUNITY</option></select>
        <select class={`status-select ${row.status.toLowerCase()}`} bind:value={row.status} aria-label={`${row.title} status`}><option>HOLD</option><option>CONFIRMED</option><option>ARRIVED</option><option>LIVE</option><option>COMPLETE</option></select>
        <textarea bind:value={row.notes} rows="2" aria-label={`${row.title} notes`}></textarea>
        <div class="row-actions"><button onclick={() => save(row)} title="Save row" disabled={busyId === row.id}><Save size={17} /></button><button onclick={() => { substitute = row; replacementTitle = ''; }} title="Substitute act"><Replace size={17} /></button></div>
      </article>
    {/each}
    {#if !filteredRows.length}<div class="empty-sheet"><CopyPlus size={28} /><p>No lineup rows match this search.</p></div>{/if}
  </section>
</div>

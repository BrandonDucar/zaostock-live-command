<script lang="ts">
  import { onMount } from 'svelte';
  import { Activity, AlertTriangle, Bot, Check, CircleDot, Plus, Save, UserRound } from 'lucide-svelte';
  import { loadEventState, mutateEventState } from '$lib/api';
  import { eventStore } from '$lib/event-store';
  import type { CrewTask } from '$lib/types';

  const columns: CrewTask['status'][] = ['QUEUED', 'ACTIVE', 'BLOCKED', 'PROOF', 'DONE'];
  let tasks = $state<CrewTask[]>([]);
  let message = $state('');
  let busyId = $state('');
  let active = $derived(tasks.filter((task) => task.status === 'ACTIVE' || task.status === 'CLAIMED'));

  onMount(async () => { try { const state = await loadEventState(); eventStore.hydrate(state); tasks = structuredClone(state.tasks); } catch (error) { message = error instanceof Error ? error.message : 'Could not load work'; } });

  function addTask() {
    tasks = [...tasks, { id: `task-${crypto.randomUUID()}`, title: 'New event task', location: 'ZAOstock', dueMinute: 12 * 60, durationMinutes: 15, capability: 'GENERAL', status: 'QUEUED', progress: 0 }];
  }
  async function save(task: CrewTask) {
    busyId = task.id;
    try { const state = await mutateEventState({ type: 'task_save', task }); eventStore.hydrate(state); tasks = structuredClone(state.tasks); message = `${task.title} saved.`; }
    catch (error) { message = error instanceof Error ? error.message : 'Save failed'; }
    finally { busyId = ''; }
  }
</script>

<svelte:head><title>Active work | ZAOstock</title><meta name="description" content="See humans and agents actively preparing ZAOstock, with blockers and proof visible." /></svelte:head>
<div class="workspace-page work-page">
  <section class="workspace-titlebar"><div><p class="eyebrow">ZAO CREW / SHARED EXECUTION</p><h1>Work in motion</h1><p>The team should feel the event taking shape. Humans and agents share one board, but every owner, blocker, and proof remains explicit.</p></div><button class="command-button red" onclick={addTask}><Plus size={18} /> Add work</button></section>
  <section class="active-now">
    <header><Activity size={22} /><div><p class="eyebrow">ACTIVE NOW</p><h2>{active.length} crew members are moving work</h2></div><span class="live-dot">LIVE</span></header>
    <div>{#each active as task}<article><span class:agent={task.assigneeType === 'AGENT'}>{task.assigneeType === 'AGENT' ? 'AI' : 'H'}</span><div><strong>{task.assignee ?? 'Unassigned'}</strong><p>{task.title}</p></div><div class="progress-meter"><i style={`width:${task.progress}%`}></i></div><em>{task.progress}%</em></article>{/each}</div>
  </section>
  {#if message}<p class="workspace-message">{message}</p>{/if}
  <section class="work-board">
    {#each columns as column}
      <div class={`work-column ${column.toLowerCase()}`}><header>{#if column === 'BLOCKED'}<AlertTriangle size={17} />{:else if column === 'DONE'}<Check size={17} />{:else}<CircleDot size={17} />{/if}<strong>{column}</strong><span>{tasks.filter((task) => task.status === column).length}</span></header>
      {#each tasks.filter((task) => task.status === column) as task (task.id)}
        <article><div class="work-owner">{#if task.assigneeType === 'AGENT'}<Bot size={15} />{:else}<UserRound size={15} />{/if}<input bind:value={task.assignee} placeholder="Owner" /></div><textarea bind:value={task.title} rows="2"></textarea><input bind:value={task.location} aria-label="Location" /><div class="work-controls"><select bind:value={task.status}>{#each columns as status}<option>{status}</option>{/each}<option>CLAIMED</option></select><input type="number" min="0" max="100" bind:value={task.progress} aria-label="Progress percent" /><button onclick={() => save(task)} disabled={busyId === task.id} title="Save"><Save size={16} /></button></div>{#if task.blockedReason}<p class="blocked-copy">{task.blockedReason}</p>{/if}{#if task.proof}<p class="proof-copy">PROOF · {task.proof}</p>{/if}</article>
      {/each}</div>
    {/each}
  </section>
</div>

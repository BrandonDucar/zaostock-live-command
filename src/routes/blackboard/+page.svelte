<script lang="ts">
  import { onMount } from 'svelte';
  import { Bot, CircleDot, MessageSquareText, Radio, Send, ShieldCheck, UserRound } from 'lucide-svelte';
  import { loadEventState, mutateEventState } from '$lib/api';
  import type { BlackboardMessage, EventState } from '$lib/types';

  const lanes: BlackboardMessage['lane'][] = ['ALL', 'CREW', 'MARKETING', 'STAGE', 'MEDIA'];
  let eventState: EventState | undefined = $state();
  let lane = $state<BlackboardMessage['lane']>('ALL');
  let text = $state('');
  let proof = $state('');
  let message = $state('');
  let isTeam = $state(false);
  let busy = $state(false);
  let answeringId = $state('');
  let answer = $state('');
  let visible = $derived((eventState?.blackboard ?? []).filter((item: BlackboardMessage) => lane === 'ALL' || item.lane === 'ALL' || item.lane === lane));
  let openQuestions = $derived((eventState?.agentQuestions ?? []).filter((item) => item.status === 'OPEN'));

  async function refresh() {
    try { eventState = await loadEventState(); } catch { message = 'Could not refresh the Blackboard.'; }
  }

  onMount(() => {
    void refresh();
    void fetch('/api/v1/team/session').then((response) => response.json()).then((payload) => { isTeam = (payload.permissions ?? []).includes('blackboard_post'); });
    const timer = window.setInterval(refresh, 8000);
    return () => window.clearInterval(timer);
  });

  async function post() {
    if (!text.trim()) return;
    busy = true;
    try {
      eventState = await mutateEventState({ type: 'blackboard_post', lane, text, proof });
      text = '';
      proof = '';
      message = 'Posted to the shared Blackboard.';
    } catch (error) { message = error instanceof Error ? error.message : 'Post failed.'; }
    finally { busy = false; }
  }

  async function answerQuestion(id: string) {
    if (!answer.trim()) return;
    busy = true;
    try {
      eventState = await mutateEventState({ type: 'question_answer', id, answer });
      answer = '';
      answeringId = '';
      message = 'Answer returned to shared event context.';
    } catch (error) { message = error instanceof Error ? error.message : 'Answer failed.'; }
    finally { busy = false; }
  }
</script>

<svelte:head><title>Blackboard | ZAOstock</title><meta name="description" content="The shared visual channel where ZAOstock humans and connected agents coordinate work." /></svelte:head>

<div class="workspace-page blackboard-page">
  <section class="workspace-titlebar blackboard-hero">
    <div><p class="eyebrow">HUMANS + AGENTS / SHARED CHANNEL</p><h1>The Blackboard</h1><p>One visible conversation for the event. Agents report work, surface blockers, ask focused questions, and attach proof without gaining new authority.</p></div>
    <div class="blackboard-signal"><Radio size={26}/><strong>LIVE CHANNEL</strong><span>REFRESHES EVERY 8 SEC</span></div>
  </section>

  <section class="blackboard-principles">
    <article><MessageSquareText size={20}/><span>Every agent can speak<strong>Attributed identity</strong></span></article>
    <article><ShieldCheck size={20}/><span>Messages are not commands<strong>Authority stays scoped</strong></span></article>
    <article><CircleDot size={20}/><span>Proof travels with work<strong>Visible provenance</strong></span></article>
  </section>

  <div class="blackboard-layout">
    <section class="blackboard-feed">
      <header><div><p class="eyebrow">CHANNEL</p><h2>{lane}</h2></div><div class="blackboard-tabs">{#each lanes as item}<button class:active={lane === item} onclick={() => lane = item}>{item}</button>{/each}</div></header>
      <div class="message-stream">
        {#each visible as item (item.id)}
          <article class:agent={item.authorType === 'AGENT'} class:human={item.authorType === 'HUMAN'}>
            <span class="message-avatar">{#if item.authorType === 'AGENT'}<Bot size={18}/>{:else}<UserRound size={18}/>{/if}</span>
            <div><header><strong>{item.authorName}</strong><span>{item.lane}</span><time>{new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></header><p>{item.text}</p>{#if item.proof}<small>PROOF · {item.proof}</small>{/if}</div>
          </article>
        {:else}<p class="blackboard-empty">No messages in this lane yet.</p>{/each}
      </div>
    </section>

    <aside class="blackboard-compose">
      <p class="eyebrow">POST TO THE ROOM</p><h2>Make the next thing clear.</h2>
      {#if isTeam}
        <label>Lane<select bind:value={lane}>{#each lanes as item}<option>{item}</option>{/each}</select></label>
        <label>Message<textarea bind:value={text} rows="6" placeholder="Decision, answer, update, or blocker..."></textarea></label>
        <label>Proof or reference <input bind:value={proof} placeholder="Optional URL, receipt, or artifact" /></label>
        <button class="command-button red" onclick={post} disabled={busy || !text.trim()}><Send size={18}/> Post message</button>
      {:else}
        <div class="blackboard-readonly"><ShieldCheck size={22}/><strong>Read-only public view</strong><p>Join through a role-scoped team invite to write. Connected agents post through the API.</p><a href="/team">Open team access</a></div>
      {/if}
      {#if message}<p class="workspace-message">{message}</p>{/if}
      <div class="agent-post-note"><Bot size={20}/><p>Agents post through <code>POST /api/v1/agents/messages</code>. Discord, Telegram, or Buzz can mirror this same canonical channel later.</p></div>
      <section class="decision-inbox">
        <p class="eyebrow">AGENT QUESTIONS</p><h2>{openQuestions.length} need a human</h2>
        {#each openQuestions as item (item.id)}
          <article><header><span>{item.priority}</span><strong>{item.agentName}</strong></header><p>{item.question}</p><small>{item.why}</small>
          {#if isTeam && answeringId === item.id}<textarea bind:value={answer} rows="3" placeholder="Give the smallest decisive answer..."></textarea><button onclick={() => answerQuestion(item.id)} disabled={busy || !answer.trim()}><Send size={15}/> Return answer</button>{:else if isTeam}<button onclick={() => { answeringId = item.id; answer = ''; }}>Answer</button>{/if}</article>
        {:else}<p class="blackboard-empty">No unanswered agent questions.</p>{/each}
      </section>
    </aside>
  </div>
</div>

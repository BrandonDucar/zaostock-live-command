<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Activity,
    ArrowRight,
    Bot,
    CalendarRange,
    Check,
    Clock3,
    CornerDownLeft,
    Gauge,
    HelpCircle,
    Radio,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    TriangleAlert,
    UserRound,
    UserRoundCog,
    Megaphone,
    Zap
  } from 'lucide-svelte';
  import LiveWire from '$lib/components/LiveWire.svelte';
  import StatusStrip from '$lib/components/StatusStrip.svelte';
  import { currentProgram, formatClock, formatTime, hermesAnswer, scenarios } from '$lib/conductor';
  import { eventStore } from '$lib/event-store';
  import type { EventState, ScenarioId } from '$lib/types';

  let question = $state('');
  let answer = $state('');
  let busy = $state(false);
  let showIntro = $state(false);
  let isRemote = $state(false);
  let programState = $derived(currentProgram($eventStore));
  let activeWork = $derived($eventStore.tasks.filter((task) => task.status === 'ACTIVE' || task.status === 'CLAIMED'));
  let setupReady = $derived([
    $eventStore.agentConnections.length > 0,
    $eventStore.program.some((item) => item.status !== 'HOLD'),
    $eventStore.crew.length > 0,
    $eventStore.marketingDrafts.length > 0
  ].filter(Boolean).length);
  const canonicalUrl = 'https://zaostock-live-command.pages.dev';
  const miniappEmbed = JSON.stringify({
    version: '1',
    imageUrl: `${canonicalUrl}/social-card.png`,
    button: {
      title: 'Open Live Command',
      action: {
        type: 'launch_miniapp',
        name: 'ZAOstock Live Command',
        url: canonicalUrl,
        splashImageUrl: `${canonicalUrl}/icon-1024.png`,
        splashBackgroundColor: '#F2E6D3'
      }
    }
  });

  onMount(() => {
    showIntro = new URLSearchParams(window.location.search).get('intro') !== '0'
      && localStorage.getItem('zaostock-intro-seen') !== '1';
    const timer = window.setInterval(() => eventStore.tick($eventStore.mode === 'REHEARSAL' ? 5 : 1), 1000);
    void loadState();
    void import('@farcaster/miniapp-sdk')
      .then(({ sdk }) => sdk.actions.ready())
      .catch(() => undefined);
    return () => window.clearInterval(timer);
  });

  async function loadState() {
    try {
      const response = await fetch('/api/v1/state');
      if (!response.ok) return;
      const payload = (await response.json()) as { state: EventState; source: string };
      if (payload.source === 'D1') {
        eventStore.hydrate(payload.state);
        isRemote = true;
      }
    } catch {
      isRemote = false;
    }
  }

  async function mutate(action: Record<string, string>) {
    busy = true;
    try {
      const response = await fetch('/api/v1/state', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(action)
      });
      if (response.ok) {
        const payload = (await response.json()) as { state: EventState };
        eventStore.hydrate(payload.state);
        isRemote = true;
        return;
      }
    } catch {
      isRemote = false;
    } finally {
      busy = false;
    }

    if (action.type === 'scenario') eventStore.inject(action.scenario as ScenarioId);
    if (action.type === 'approve') eventStore.approve(action.optionId);
    if (action.type === 'reset') eventStore.reset();
  }

  function ask() {
    if (!question.trim()) return;
    answer = hermesAnswer($eventStore, question);
  }

  function closeIntro() {
    localStorage.setItem('zaostock-intro-seen', '1');
    showIntro = false;
  }
</script>

<svelte:head>
  <title>ZAOstock Live Command</title>
  <meta name="description" content="A live event nervous system for ZAOstock: shared reality, crew coordination, WaveWarZ state, rehearsal, and recovery." />
  <meta property="og:title" content="ZAOstock Live Command" />
  <meta property="og:description" content="Break the festival before the crowd arrives. Watch Hermes and three focused minions coordinate ZAOstock in real time." />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="/social-card.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="ZAOstock Live Command" />
  <meta name="twitter:description" content="A living command surface for stage, crew, WaveWarZ, and event recovery." />
  <meta name="twitter:image" content="/social-card.png" />
  <meta name="application-name" content="ZAOstock Live Command" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="fc:miniapp" content={miniappEmbed} />
  <meta name="fc:frame" content={miniappEmbed} />
  <link rel="canonical" href={canonicalUrl} />
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="icon" href="/icon-192.png" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
</svelte:head>

{#if showIntro}
  <div class="intro-overlay" role="dialog" aria-modal="true" aria-labelledby="intro-title">
    <div class="intro-sheet">
      <p class="eyebrow">ZAOSTOCK / TEAM OPERATING ROOM</p>
      <h1 id="intro-title">Build the lineup. Bring the crew. Connect any agent.</h1>
      <p>Start with the program and people, connect Zaal's agent, then watch humans and agents move the work together. Rehearsal mode lets the team break the event before the crowd arrives.</p>
      <div class="intro-steps">
        <span><strong>01</strong> Connect an authorized agent</span>
        <span><strong>02</strong> Build lineup and staff</span>
        <span><strong>03</strong> Run work and rehearsal</span>
      </div>
      <button class="command-button red" onclick={closeIntro}>Enter Live Command <ArrowRight size={20} /></button>
    </div>
  </div>
{/if}

<div class="command-page">
  <section class="command-masthead">
    <div>
      <p class="eyebrow">EVENT CONTROL / OCTOBER 03</p>
      <h1>ZAOstock <span>Live</span></h1>
    </div>

    <div class="mode-control" aria-label="Event mode">
      <button class:active={$eventStore.mode === 'LIVE'} onclick={() => eventStore.setMode('LIVE')}>LIVE</button>
      <button class:active={$eventStore.mode === 'REHEARSAL'} onclick={() => eventStore.setMode('REHEARSAL')}>REHEARSAL</button>
    </div>

    <div class="event-clock">
      <Clock3 size={22} />
      <div>
        <time>{formatClock($eventStore.clockMinute, $eventStore.clockSecond)}</time>
        <small>{$eventStore.mode === 'REHEARSAL' ? 'ACCELERATED EVENT TIME' : 'EVENT REALITY CLOCK'}</small>
      </div>
    </div>
  </section>

  <section class="workflow-rail" aria-label="ZAOstock setup workflow">
    <header>
      <div><p class="eyebrow">START HERE</p><h2>Build the event, then conduct it.</h2></div>
      <span>{setupReady}/4 READY</span>
    </header>
    <div>
      <a href="/connect" class:complete={$eventStore.agentConnections.length > 0}>
        <strong>01</strong><Bot size={22} /><span><b>Connect agent</b><small>Give your agent scoped event context</small></span><ArrowRight size={18} />
      </a>
      <a href="/program" class:complete={$eventStore.program.length > 0}>
        <strong>02</strong><CalendarRange size={22} /><span><b>Build lineup</b><small>Add, reorder, or substitute acts</small></span><ArrowRight size={18} />
      </a>
      <a href="/staff" class:complete={$eventStore.crew.length > 0}>
        <strong>03</strong><UserRoundCog size={22} /><span><b>Schedule staff</b><small>Roles, shifts, assignments, check-ins</small></span><ArrowRight size={18} />
      </a>
      <a href="/marketing" class:complete={$eventStore.marketingDrafts.length > 0}>
        <strong>04</strong><Megaphone size={22} /><span><b>Prepare marketing</b><small>Draft from the real program</small></span><ArrowRight size={18} />
      </a>
    </div>
  </section>

  <section class="pulse-band" class:danger={$eventStore.pulse < 75}>
    <div class="pulse-score">
      <Gauge size={30} />
      <span>PULSE</span>
      <strong>{$eventStore.pulse}</strong>
    </div>
    <div class="pulse-line" aria-label={`Event pulse ${$eventStore.pulse} out of 100`}>
      <span style={`width: ${$eventStore.pulse}%`}></span>
    </div>
    <div class="evidence-source"><ShieldCheck size={18} /> {isRemote ? 'D1 SHARED STATE' : 'LOCAL REHEARSAL STATE'}</div>
  </section>

  <section class="command-active-work">
    <header><Activity size={20} /><div><p class="eyebrow">THE CREW IS WORKING</p><h2>{activeWork.length} active assignments</h2></div><a href="/work">Open work board <ArrowRight size={16} /></a></header>
    <div>
      {#each activeWork.slice(0, 4) as task}
        <article><span class:agent={task.assigneeType === 'AGENT'}>{#if task.assigneeType === 'AGENT'}<Bot size={17} />{:else}<UserRound size={17} />{/if}</span><div><strong>{task.assignee ?? 'Unassigned'}</strong><p>{task.title}</p></div><div class="progress-meter"><i style={`width:${task.progress}%`}></i></div><em>{task.progress}%</em></article>
      {/each}
    </div>
  </section>

  <div class="command-grid">
    <section class="program-board">
      <article class="now-block">
        <p class="block-label">NOW</p>
        <span class="kind">{programState.now?.kind ?? 'PROGRAM'}</span>
        <h2>{programState.now?.title ?? 'Between program blocks'}</h2>
        <p>{programState.now?.venue ?? 'Festival Grounds'}</p>
        <div class="remaining">
          <span style={`width: ${programState.now ? Math.max(6, Math.round((programState.remainingMinutes / programState.now.durationMinutes) * 100)) : 0}%`}></span>
        </div>
        <strong class="remaining-time">{String(programState.remainingMinutes).padStart(2, '0')}:00 REMAINING</strong>
      </article>

      <article class="next-block">
        <div>
          <p class="block-label">NEXT</p>
          <h3>{programState.next?.title ?? 'Program complete'}</h3>
          <p>{programState.next?.venue ?? 'Festival Grounds'}</p>
        </div>
        <time>{programState.next ? formatTime(programState.next.startMinute + $eventStore.scheduleDriftMinutes) : '--'}</time>
      </article>

      <article class="hermes-block">
        <header>
          <div class="hermes-mark"><Sparkles size={20} /></div>
          <div>
            <p class="block-label">HERMES / EVENT CONDUCTOR</p>
            <small>CONDUCTING BY EXCEPTION</small>
          </div>
          <span class:approval={$eventStore.hermes.awaitingApproval}>{$eventStore.hermes.awaitingApproval ? 'APPROVAL NEEDED' : 'OBSERVING'}</span>
        </header>
        <blockquote>“{$eventStore.hermes.statement}”</blockquote>
        {#if $eventStore.hermes.recommendation}
          <p class="recommendation"><Zap size={18} /> {$eventStore.hermes.recommendation}</p>
        {/if}
        {#if $eventStore.hermes.recoveryOptions.length}
          <div class="recovery-options">
            {#each $eventStore.hermes.recoveryOptions as option, index}
              <button onclick={() => mutate({ type: 'approve', optionId: option.id })} disabled={busy}>
                <span>{String.fromCharCode(65 + index)}</span>
                <div><strong>{option.label}</strong><small>{option.detail}</small></div>
                <em>{option.interventionLevel === 3 ? 'HUMAN GATE' : 'REVERSIBLE'}</em>
                <ArrowRight size={18} />
              </button>
            {/each}
          </div>
        {/if}
      </article>
    </section>

    <aside class="command-sidebar">
      <section class="chaos-panel">
        <header>
          <div>
            <p class="eyebrow">FINALS CONTROL</p>
            <h2>Break the festival.</h2>
          </div>
          <TriangleAlert size={25} />
        </header>
        <p>Inject a rehearsal failure. Watch the three minions update one shared Reality and Hermes calculate the next move.</p>
        <div class="chaos-grid">
          {#each scenarios as scenario}
            <button class={`chaos-button ${scenario.accent}`} onclick={() => mutate({ type: 'scenario', scenario: scenario.id })} disabled={busy} title={scenario.description}>
              <span>{scenario.shortLabel}</span>
              <ArrowRight size={17} />
            </button>
          {/each}
        </div>
        <button class="reset-button" onclick={() => mutate({ type: 'reset' })} disabled={busy}><RefreshCw size={17} /> Reset rehearsal</button>
      </section>

      <section class="risk-panel">
        <header><Activity size={20} /><h2>Attention Queue</h2><span>{$eventStore.hermes.riskSummary.length}</span></header>
        {#each $eventStore.hermes.riskSummary as risk, index}
          <article><strong>{String(index + 1).padStart(2, '0')}</strong><p>{risk}</p></article>
        {:else}
          <article><Check size={18} /><p>No risks exceed policy threshold.</p></article>
        {/each}
      </section>

      <section class="ask-panel">
        <header><HelpCircle size={20} /><h2>Ask ZAOstock</h2></header>
        <form onsubmit={(event) => { event.preventDefault(); ask(); }}>
          <input bind:value={question} aria-label="Ask ZAOstock" placeholder="What can go wrong right now?" />
          <button aria-label="Ask Hermes"><CornerDownLeft size={18} /></button>
        </form>
        <div class="quick-asks">
          {#each ['Who can cover content?', 'Are we ready for WaveWarZ?', 'What changed?'] as prompt}
            <button onclick={() => { question = prompt; ask(); }}>{prompt}</button>
          {/each}
        </div>
        {#if answer}<p class="answer"><strong>HERMES</strong>{answer}</p>{/if}
      </section>
    </aside>
  </div>

  <div class="lower-grid">
    <LiveWire events={$eventStore.wire} compact />
    <section class="minion-board">
      <header><p class="eyebrow">THREE REAL MINIONS</p><h2>Focused state. Shared Reality.</h2></header>
      <div class="minion-grid">
        <article><span class={`minion-light ${$eventStore.systems.STAGE.toLowerCase()}`}></span><strong>Stage</strong><p>Run-of-show, timing, cues</p><em>{$eventStore.scheduleDriftMinutes > 0 ? `+${$eventStore.scheduleDriftMinutes}m drift` : 'On plan'}</em></article>
        <article><span class={`minion-light ${$eventStore.systems.CREW.toLowerCase()}`}></span><strong>Crew</strong><p>Check-ins, roles, assignments</p><em>{$eventStore.crew.filter((member) => member.checkedIn).length}/{$eventStore.crew.length} checked in</em></article>
        <article><span class={`minion-light ${$eventStore.systems.BATTLE.toLowerCase()}`}></span><strong>WaveWarZ</strong><p>Battle clock, voting, results</p><em>{$eventStore.voteDelayMinutes ? `+${$eventStore.voteDelayMinutes}m vote delay` : 'Ready'}</em></article>
      </div>
    </section>
  </div>

  <section class="zao-constellation">
    <header><div><p class="eyebrow">ZAO CONSTELLATION / TEAM CONTEXT</p><h2>One event, the whole movement behind it.</h2></div><span>ECOSYSTEM MAP</span></header>
    <div class="constellation-grid">
      <a href="https://bettercallzaal.com" target="_blank"><strong>ZAO OS</strong><small>Community + governance</small></a>
      <a href="https://farcaster.xyz/zaal" target="_blank"><strong>WaveWarZ</strong><small>Artists + competition</small></a>
      <a href="https://zabalgamez.com" target="_blank"><strong>ZABAL Gamez</strong><small>Builder arena</small></a>
      <div class="constellation-core"><span>Z</span><strong>ZAOstock</strong><small>October 03 · Ellsworth</small></div>
      <a href="https://bczyapz.com" target="_blank"><strong>BCZ YapZ</strong><small>Stories + signal</small></a>
      <a href="https://github.com/bettercallzaal/zabalbot" target="_blank"><strong>ZABAL Bot</strong><small>Community interface</small></a>
      <a href="https://github.com/ZAODEVZ/ZAOcowork" target="_blank"><strong>ZAOcowork</strong><small>Organization work</small></a>
      <a href="/connect"><strong>Agent API</strong><small>Runtime-neutral handoff</small></a>
    </div>
    <p class="constellation-note">This map is organizational context. Technical connections remain separately authenticated and verified.</p>
  </section>

  <StatusStrip />
</div>

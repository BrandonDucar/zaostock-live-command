import type {
  CrewTask,
  EventState,
  ProgramItem,
  RecoveryOption,
  Scenario,
  ScenarioId,
  SystemName,
  SystemStatus,
  WireEvent
} from './types';

export const EVENT_DAY_START = 12 * 60;

export const scenarios: Scenario[] = [
  {
    id: 'artist-delay',
    label: 'Artist runs 10 minutes over',
    shortLabel: 'ARTIST +10 MIN',
    description: 'Threatens the WaveWarZ hard start and compresses stage changeover.',
    accent: 'red'
  },
  {
    id: 'volunteer-no-show',
    label: 'Content volunteer does not check in',
    shortLabel: 'VOLUNTEER NO-SHOW',
    description: 'Creates a coverage gap during the WaveWarZ crowd arrival window.',
    accent: 'gold'
  },
  {
    id: 'stream-down',
    label: 'Primary stream goes offline',
    shortLabel: 'STREAM DOWN',
    description: 'Media output fails while the live audience remains active.',
    accent: 'denim'
  },
  {
    id: 'vote-delay',
    label: 'WaveWarZ vote closes late',
    shortLabel: 'WAVEWARZ VOTE DELAY',
    description: 'Battle results threaten the following program transition.',
    accent: 'olive'
  }
];

const program: ProgramItem[] = [
  { id: 'welcome', title: 'Gates + Community Warmup', venue: 'Festival Grounds', startMinute: 14 * 60 + 30, durationMinutes: 40, kind: 'COMMUNITY' },
  { id: 'lyons-den', title: 'Lyons Den', venue: 'Parklet Stage', startMinute: 15 * 60 + 10, durationMinutes: 42, kind: 'MUSIC' },
  { id: 'wavewarz-story', title: 'WaveWarZ Story', venue: 'Main Stage', startMinute: 16 * 60, durationMinutes: 20, kind: 'STORY' },
  { id: 'black-moon', title: 'Black Moon', venue: 'Parklet Stage', startMinute: 16 * 60 + 30, durationMinutes: 45, kind: 'MUSIC' },
  { id: 'wavewarz-final', title: 'WaveWarZ Final', venue: 'Main Stage', startMinute: 17 * 60 + 35, durationMinutes: 35, kind: 'BATTLE' },
  { id: 'closing', title: 'ZAOstock Closing Set', venue: 'Main Stage', startMinute: 18 * 60 + 25, durationMinutes: 45, kind: 'MUSIC' }
];

const tasks: CrewTask[] = [
  { id: 'task-storefront', title: 'Partner storefront photo', location: 'South Market Row', dueMinute: 15 * 60 + 50, durationMinutes: 8, capability: 'CONTENT', status: 'OPEN' },
  { id: 'task-crowd', title: 'WaveWarZ crowd arrival', location: 'Main Stage', dueMinute: 15 * 60 + 55, durationMinutes: 12, capability: 'CONTENT', status: 'CLAIMED', assignee: 'Maya' },
  { id: 'task-teardown', title: 'Confirm Black Moon teardown lead', location: 'Parklet Stage', dueMinute: 17 * 60 + 12, durationMinutes: 10, capability: 'STAGE', status: 'OPEN' }
];

function event(id: string, atMinute: number, source: WireEvent['source'], severity: WireEvent['severity'], message: string, proofClass: WireEvent['proofClass'] = 'SIMULATED'): WireEvent {
  return { id, atMinute, source, severity, message, proofClass };
}

export function createInitialState(): EventState {
  const state: EventState = {
    eventId: 'zaostock-2026',
    eventName: 'ZAOstock',
    eventDate: '2026-10-03',
    mode: 'REHEARSAL',
    clockMinute: 15 * 60 + 42,
    clockSecond: 17,
    scheduleDriftMinutes: 3,
    pulse: 91,
    streamHealthy: true,
    voteDelayMinutes: 0,
    program: structuredClone(program),
    crew: [
      { id: 'crew-maya', name: 'Maya', capability: 'CONTENT', checkedIn: true, available: false },
      { id: 'crew-alex', name: 'Alex', capability: 'CONTENT', checkedIn: true, available: true },
      { id: 'crew-jules', name: 'Jules', capability: 'STAGE', checkedIn: true, available: true },
      { id: 'crew-noah', name: 'Noah', capability: 'MEDIA', checkedIn: true, available: true }
    ],
    tasks: structuredClone(tasks),
    systems: {
      STAGE: 'WATCH',
      CREW: 'HEALTHY',
      BATTLE: 'HEALTHY',
      MEDIA: 'HEALTHY',
      TASKS: 'WATCH',
      PROOF: 'HEALTHY'
    },
    hermes: {
      statement: 'Current drift is recoverable. No intervention recommended.',
      riskSummary: [
        'WaveWarZ transition has four minutes of recoverable buffer.',
        'Black Moon transition has no confirmed teardown lead.'
      ],
      recoveryOptions: [],
      awaitingApproval: false
    },
    wire: [
      event('wire-1', 15 * 60 + 31, 'STAGE', 'INFO', 'Lyons Den set started.'),
      event('wire-2', 15 * 60 + 37, 'CREW', 'INFO', 'Content task completed.'),
      event('wire-3', 15 * 60 + 41, 'STAGE', 'WATCH', '+3m schedule drift detected.'),
      event('wire-4', 15 * 60 + 42, 'HERMES', 'INFO', 'No intervention required.')
    ]
  };

  return evaluateState(state);
}

function recoveryOptionsForDelay(state: EventState): RecoveryOption[] {
  const waveWarz = state.program.find((item) => item.id === 'wavewarz-story');
  const start = waveWarz?.startMinute ?? 16 * 60;
  return [
    { id: 'recover-buffer', label: 'Recover six minutes', detail: 'Use changeover and MC buffer. No artist set is cut.', projectedStartMinute: start + Math.max(0, state.scheduleDriftMinutes - 6), interventionLevel: 3 },
    { id: 'shift-program', label: 'Shift remaining music', detail: 'Preserve every transition and move the remaining program.', projectedStartMinute: start + state.scheduleDriftMinutes, interventionLevel: 3 },
    { id: 'manual-plan', label: 'Manual stage plan', detail: 'Hand control to the stage manager with all downstream impacts visible.', projectedStartMinute: start + state.scheduleDriftMinutes, interventionLevel: 3 }
  ];
}

function addWire(state: EventState, source: WireEvent['source'], severity: WireEvent['severity'], message: string, suffix: string): EventState {
  const next = structuredClone(state);
  next.wire = [
    ...next.wire,
    event(`wire-${Date.now()}-${suffix}`, next.clockMinute, source, severity, message)
  ].slice(-40);
  return next;
}

export function evaluateState(input: EventState): EventState {
  const state = structuredClone(input);
  const systems: Record<SystemName, SystemStatus> = {
    STAGE: state.scheduleDriftMinutes >= 9 ? 'DEGRADED' : state.scheduleDriftMinutes >= 3 ? 'WATCH' : 'HEALTHY',
    CREW: state.crew.some((member) => !member.checkedIn) ? 'DEGRADED' : state.tasks.some((task) => task.status === 'OPEN') ? 'WATCH' : 'HEALTHY',
    BATTLE: state.voteDelayMinutes >= 5 ? 'DEGRADED' : state.voteDelayMinutes > 0 ? 'WATCH' : 'HEALTHY',
    MEDIA: state.streamHealthy ? 'HEALTHY' : 'OFFLINE',
    TASKS: state.tasks.some((task) => task.status === 'OPEN' && task.dueMinute <= state.clockMinute + 15) ? 'DEGRADED' : state.tasks.some((task) => task.status === 'OPEN') ? 'WATCH' : 'HEALTHY',
    PROOF: 'HEALTHY'
  };

  state.systems = systems;
  let pulse = 100;
  pulse -= Math.min(18, Math.max(0, state.scheduleDriftMinutes) * 1.5);
  pulse -= state.streamHealthy ? 0 : 22;
  pulse -= Math.min(14, state.voteDelayMinutes * 2);
  pulse -= state.crew.filter((member) => !member.checkedIn).length * 10;
  pulse -= state.tasks.filter((task) => task.status === 'OPEN' && task.dueMinute <= state.clockMinute + 15).length * 5;
  state.pulse = Math.max(0, Math.round(pulse));

  const risks: string[] = [];
  if (state.scheduleDriftMinutes >= 6) risks.push(`WaveWarZ hard start is threatened by ${state.scheduleDriftMinutes} minutes of stage drift.`);
  else if (state.scheduleDriftMinutes > 0) risks.push(`Stage is running ${state.scheduleDriftMinutes} minutes late, inside the current recovery buffer.`);
  if (!state.streamHealthy) risks.push('Primary stream is offline; local program can continue while Media switches paths.');
  if (state.crew.some((member) => !member.checkedIn)) risks.push('A scheduled crew member has not checked in.');
  if (state.voteDelayMinutes > 0) risks.push(`WaveWarZ voting is delayed by ${state.voteDelayMinutes} minutes.`);
  if (state.tasks.some((task) => task.status === 'OPEN')) risks.push(`${state.tasks.filter((task) => task.status === 'OPEN').length} crew tasks remain open.`);

  state.hermes.riskSummary = risks;
  if (state.scheduleDriftMinutes >= 9) {
    state.hermes.statement = 'WaveWarZ hard start is threatened. Human stage approval is required.';
    state.hermes.recommendation = 'Recover six minutes through changeover and MC buffer.';
    state.hermes.recoveryOptions = recoveryOptionsForDelay(state);
    state.hermes.awaitingApproval = true;
  } else if (!state.streamHealthy) {
    state.hermes.statement = 'Primary stream is offline. Program remains safe to continue.';
    state.hermes.recommendation = 'Switch Media to the standby ingest and preserve local screens.';
    state.hermes.recoveryOptions = [
      { id: 'standby-stream', label: 'Activate standby stream', detail: 'Reversible media routing action. Stage timing is unchanged.', projectedStartMinute: state.clockMinute, interventionLevel: 2 }
    ];
    state.hermes.awaitingApproval = false;
  } else if (state.crew.some((member) => !member.checkedIn)) {
    const replacement = state.crew.find((member) => member.checkedIn && member.available && member.capability === 'CONTENT');
    state.hermes.statement = 'A coverage gap is forming during WaveWarZ crowd arrival.';
    state.hermes.recommendation = replacement ? `Notify ${replacement.name} and offer the content assignment.` : 'Open a priority crew task and escalate if unclaimed.';
    state.hermes.recoveryOptions = [];
    state.hermes.awaitingApproval = false;
  } else if (state.voteDelayMinutes > 0) {
    state.hermes.statement = 'Battle voting is late but still recoverable.';
    state.hermes.recommendation = 'Hold the results overlay and preserve the next stage cue.';
    state.hermes.recoveryOptions = [];
    state.hermes.awaitingApproval = false;
  } else {
    state.hermes.statement = state.scheduleDriftMinutes > 0
      ? 'Current drift is recoverable. No intervention recommended.'
      : 'All observed systems are inside plan. No intervention recommended.';
    state.hermes.recommendation = undefined;
    state.hermes.recoveryOptions = [];
    state.hermes.awaitingApproval = false;
  }
  return state;
}

export function injectScenario(input: EventState, scenario: ScenarioId): EventState {
  let state = structuredClone(input);
  state.mode = 'REHEARSAL';
  state.lastScenario = scenario;

  if (scenario === 'artist-delay') {
    state.scheduleDriftMinutes += 10;
    state = addWire(state, 'STAGE', 'CRITICAL', 'Artist timing deviation +10m. WaveWarZ hard start threatened.', scenario);
  }
  if (scenario === 'volunteer-no-show') {
    const member = state.crew.find((candidate) => candidate.id === 'crew-maya');
    if (member) member.checkedIn = false;
    const affected = state.tasks.find((task) => task.id === 'task-crowd');
    if (affected) {
      affected.status = 'OPEN';
      affected.assignee = undefined;
    }
    state = addWire(state, 'CREW', 'ACTION', 'Content volunteer did not check in. Coverage search started.', scenario);
  }
  if (scenario === 'stream-down') {
    state.streamHealthy = false;
    state = addWire(state, 'MEDIA', 'CRITICAL', 'Primary stream heartbeat lost. Standby route available.', scenario);
  }
  if (scenario === 'vote-delay') {
    state.voteDelayMinutes += 6;
    state = addWire(state, 'BATTLE', 'ACTION', 'WaveWarZ vote window exceeded plan by six minutes.', scenario);
  }

  state = evaluateState(state);
  return addWire(state, 'HERMES', state.hermes.awaitingApproval ? 'ACTION' : 'WATCH', state.hermes.statement, `${scenario}-response`);
}

export function approveRecovery(input: EventState, optionId: string): EventState {
  let state = structuredClone(input);
  if (optionId === 'recover-buffer') state.scheduleDriftMinutes = Math.max(0, state.scheduleDriftMinutes - 6);
  if (optionId === 'shift-program') {
    state.program = state.program.map((item) => item.startMinute >= 16 * 60 ? { ...item, startMinute: item.startMinute + state.scheduleDriftMinutes } : item);
    state.scheduleDriftMinutes = 0;
  }
  if (optionId === 'standby-stream') state.streamHealthy = true;
  state = addWire(state, 'HUMAN', 'INFO', `Recovery option approved: ${optionId}.`, `approved-${optionId}`);
  state = evaluateState(state);
  return addWire(state, 'HERMES', 'INFO', 'Recovery propagated to the shared event state.', `propagated-${optionId}`);
}

export function claimTask(input: EventState, taskId: string, name: string): EventState {
  let state = structuredClone(input);
  const task = state.tasks.find((candidate) => candidate.id === taskId);
  if (!task || task.status !== 'OPEN') return state;
  task.status = 'CLAIMED';
  task.assignee = name;
  state = addWire(state, 'CREW', 'INFO', `${name} took "${task.title}".`, `claim-${taskId}`);
  return evaluateState(state);
}

export function tick(input: EventState, seconds = 1): EventState {
  const state = structuredClone(input);
  const total = state.clockSecond + seconds;
  state.clockMinute += Math.floor(total / 60);
  state.clockSecond = total % 60;
  return state;
}

export function currentProgram(state: EventState): { now?: ProgramItem; next?: ProgramItem; remainingMinutes: number } {
  const effective = state.clockMinute - state.scheduleDriftMinutes;
  const now = state.program.find((item) => effective >= item.startMinute && effective < item.startMinute + item.durationMinutes);
  const next = state.program.find((item) => item.startMinute > (now?.startMinute ?? effective));
  const remainingMinutes = now ? Math.max(0, now.startMinute + now.durationMinutes - effective) : 0;
  return { now, next, remainingMinutes };
}

export function formatClock(minute: number, second = 0): string {
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(mins).padStart(2, '0')}:${String(second).padStart(2, '0')} ${suffix}`;
}

export function formatTime(minute: number): string {
  return formatClock(minute).replace(':00 ', ' ');
}

export function hermesAnswer(state: EventState, question: string): string {
  const normalized = question.toLowerCase();
  if (normalized.includes('fuck') || normalized.includes('risk') || normalized.includes('wrong')) {
    return state.hermes.riskSummary.length
      ? `Current risks: ${state.hermes.riskSummary.join(' ')} Highest attention: ${state.hermes.riskSummary[0]}`
      : 'No active risks exceed the event policy threshold.';
  }
  if (normalized.includes('cover') || normalized.includes('crew') || normalized.includes('content')) {
    const matches = state.crew.filter((member) => member.checkedIn && member.available && member.capability === 'CONTENT');
    return matches.length ? `${matches.map((member) => member.name).join(' and ')} can cover content now. Hermes can notify them without changing the critical run-of-show.` : 'No checked-in content specialist is currently available. Open a priority task and escalate.';
  }
  if (normalized.includes('wavewarz') || normalized.includes('battle') || normalized.includes('ready')) {
    return state.voteDelayMinutes > 0
      ? `WaveWarZ is not fully ready: voting is ${state.voteDelayMinutes} minutes behind plan. ${state.hermes.recommendation ?? ''}`
      : `WaveWarZ systems are ${state.systems.BATTLE.toLowerCase()}. Stage drift is ${state.scheduleDriftMinutes} minutes and the stream is ${state.streamHealthy ? 'healthy' : 'offline'}.`;
  }
  if (normalized.includes('changed') || normalized.includes('last hour')) {
    return state.wire.slice(-4).map((item) => `${item.source}: ${item.message}`).join(' ');
  }
  return `${state.hermes.statement}${state.hermes.recommendation ? ` Recommendation: ${state.hermes.recommendation}` : ''}`;
}


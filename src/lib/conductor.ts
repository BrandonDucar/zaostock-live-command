import type {
  CrewTask,
  CrewMember,
  AgentQuestion,
  BlackboardMessage,
  EventState,
  MarketingDraft,
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
  { id: 'welcome', title: 'Gates + Community Warmup', venue: 'Franklin Street Parklet', startMinute: 12 * 60, durationMinutes: 30, kind: 'COMMUNITY', status: 'HOLD', notes: 'Rehearsal fixture. Replace with the confirmed event-day plan.' },
  { id: 'artist-slot-01', title: 'Artist Slot 01', venue: 'ZAOstock Stage', startMinute: 12 * 60 + 30, durationMinutes: 40, kind: 'MUSIC', status: 'HOLD', notes: 'No artist inferred. Organizer confirmation required.' },
  { id: 'wavewarz-story', title: 'WaveWarZ Story', venue: 'ZAOstock Stage', startMinute: 13 * 60 + 20, durationMinutes: 20, kind: 'STORY', status: 'HOLD', notes: 'Rehearsal fixture. Protect transition buffer.' },
  { id: 'artist-slot-02', title: 'Artist Slot 02', venue: 'ZAOstock Stage', startMinute: 13 * 60 + 50, durationMinutes: 40, kind: 'MUSIC', status: 'HOLD', notes: 'No artist inferred. Organizer confirmation required.' },
  { id: 'wavewarz-final', title: 'WaveWarZ Final', venue: 'ZAOstock Stage', startMinute: 14 * 60 + 40, durationMinutes: 35, kind: 'BATTLE', status: 'HOLD', notes: 'Rehearsal fixture. Voting closes before result overlay.' },
  { id: 'closing', title: 'Closing Artist Slot', venue: 'ZAOstock Stage', startMinute: 15 * 60 + 25, durationMinutes: 45, kind: 'MUSIC', status: 'HOLD', notes: 'No artist inferred. Organizer confirmation required.' }
];

const tasks: CrewTask[] = [
  { id: 'task-lineup', title: 'Replace rehearsal artist slots with confirmed lineup', location: 'Program workspace', dueMinute: 11 * 60, durationMinutes: 25, capability: 'ADMIN', status: 'ACTIVE', assignee: 'Zaal', assigneeType: 'HUMAN', progress: 45 },
  { id: 'task-agent-handoff', title: 'Connect an authorized agent to shared event context', location: 'Agent gateway', dueMinute: 11 * 60 + 15, durationMinutes: 12, capability: 'AGENT', status: 'ACTIVE', assignee: 'Hermes', assigneeType: 'AGENT', progress: 68 },
  { id: 'task-staff', title: 'Confirm event staff roles and shift coverage', location: 'Staff workspace', dueMinute: 11 * 60 + 30, durationMinutes: 20, capability: 'CREW', status: 'QUEUED', progress: 10 },
  { id: 'task-marketing', title: 'Prepare first lineup reveal draft', location: 'Marketing workspace', dueMinute: 12 * 60, durationMinutes: 15, capability: 'MARKETING', status: 'PROOF', assignee: 'Signal', assigneeType: 'AGENT', progress: 92, proof: 'Draft awaiting organizer approval; nothing published.' },
  { id: 'task-sitewalk', title: 'Map day-of crew stations at Franklin Street Parklet', location: 'Ellsworth, Maine', dueMinute: 13 * 60, durationMinutes: 30, capability: 'PRODUCTION', status: 'BLOCKED', assignee: 'Event Admin', assigneeType: 'HUMAN', progress: 20, blockedReason: 'Requires an on-site walk or organizer floor plan.' },
  { id: 'task-proof', title: 'Verify public command surface and agent health', location: 'Cloudflare edge', dueMinute: 10 * 60 + 45, durationMinutes: 8, capability: 'ENGINEERING', status: 'DONE', assignee: 'Codex', assigneeType: 'AGENT', progress: 100, proof: 'Public health and core routes checked.' }
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
    clockMinute: 12 * 60 + 42,
    clockSecond: 17,
    scheduleDriftMinutes: 3,
    pulse: 91,
    streamHealthy: true,
    voteDelayMinutes: 0,
    program: structuredClone(program),
    crew: [
      { id: 'crew-maya', name: 'Maya', capability: 'CONTENT', checkedIn: true, available: false, role: 'Photographer', shiftStartMinute: 14 * 60 + 45, shiftEndMinute: 18 * 60, assignment: 'WaveWarZ crowd arrival' },
      { id: 'crew-alex', name: 'Alex', capability: 'CONTENT', checkedIn: true, available: true, role: 'Content Runner', shiftStartMinute: 15 * 60, shiftEndMinute: 19 * 60, assignment: 'Roaming coverage' },
      { id: 'crew-jules', name: 'Jules', capability: 'STAGE', checkedIn: true, available: true, role: 'Stage Assistant', shiftStartMinute: 14 * 60, shiftEndMinute: 19 * 60, assignment: 'Parklet changeovers' },
      { id: 'crew-noah', name: 'Noah', capability: 'MEDIA', checkedIn: true, available: true, role: 'Stream Operator', shiftStartMinute: 14 * 60 + 30, shiftEndMinute: 19 * 60 + 30, assignment: 'Primary + standby stream' }
    ],
    tasks: structuredClone(tasks),
    marketingDrafts: [
      {
        id: 'marketing-wavewarz-countdown',
        programItemId: 'wavewarz-story',
        platform: 'FARCASTER',
        publishMinute: 15 * 60 + 40,
        headline: 'WaveWarZ starts in 20 minutes',
        body: 'Make your way to the Main Stage. The story begins at 4:00 PM, then the crowd helps carry the battle.',
        status: 'DRAFT',
        createdBy: 'SIGNAL_MARKETING_AGENT'
      }
    ],
    agentQuestions: [],
    blackboard: [
      {
        id: 'blackboard-welcome',
        authorId: 'system',
        authorName: 'Live Command',
        authorType: 'SYSTEM',
        lane: 'ALL',
        text: 'Blackboard online. Humans and connected agents share context here; messages never grant new authority.',
        createdAt: '2026-08-30T12:00:00.000Z'
      }
    ],
    agentConnections: [],
    systems: {
      STAGE: 'WATCH',
      CREW: 'HEALTHY',
      BATTLE: 'HEALTHY',
      MEDIA: 'HEALTHY',
      TASKS: 'WATCH',
      MARKETING: 'WATCH',
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
    CREW: state.crew.some((member) => !member.checkedIn) ? 'DEGRADED' : state.tasks.some((task) => task.status === 'QUEUED' || task.status === 'BLOCKED') ? 'WATCH' : 'HEALTHY',
    BATTLE: state.voteDelayMinutes >= 5 ? 'DEGRADED' : state.voteDelayMinutes > 0 ? 'WATCH' : 'HEALTHY',
    MEDIA: state.streamHealthy ? 'HEALTHY' : 'OFFLINE',
    TASKS: state.tasks.some((task) => task.status === 'BLOCKED' || (task.status === 'QUEUED' && task.dueMinute <= state.clockMinute + 15)) ? 'DEGRADED' : state.tasks.some((task) => !['DONE', 'PROOF'].includes(task.status)) ? 'WATCH' : 'HEALTHY',
    MARKETING: state.marketingDrafts.some((draft) => draft.status === 'APPROVED') ? 'HEALTHY' : state.marketingDrafts.length ? 'WATCH' : 'DEGRADED',
    PROOF: 'HEALTHY'
  };

  state.systems = systems;
  let pulse = 100;
  pulse -= Math.min(18, Math.max(0, state.scheduleDriftMinutes) * 1.5);
  pulse -= state.streamHealthy ? 0 : 22;
  pulse -= Math.min(14, state.voteDelayMinutes * 2);
  pulse -= state.crew.filter((member) => !member.checkedIn).length * 10;
  pulse -= state.tasks.filter((task) => task.status === 'BLOCKED' || (task.status === 'QUEUED' && task.dueMinute <= state.clockMinute + 15)).length * 5;
  state.pulse = Math.max(0, Math.round(pulse));

  const risks: string[] = [];
  if (state.scheduleDriftMinutes >= 6) risks.push(`WaveWarZ hard start is threatened by ${state.scheduleDriftMinutes} minutes of stage drift.`);
  else if (state.scheduleDriftMinutes > 0) risks.push(`Stage is running ${state.scheduleDriftMinutes} minutes late, inside the current recovery buffer.`);
  if (!state.streamHealthy) risks.push('Primary stream is offline; local program can continue while Media switches paths.');
  if (state.crew.some((member) => !member.checkedIn)) risks.push('A scheduled crew member has not checked in.');
  if (state.voteDelayMinutes > 0) risks.push(`WaveWarZ voting is delayed by ${state.voteDelayMinutes} minutes.`);
  if (state.tasks.some((task) => task.status === 'BLOCKED')) risks.push(`${state.tasks.filter((task) => task.status === 'BLOCKED').length} work item is blocked.`);
  if (state.tasks.some((task) => task.status === 'QUEUED')) risks.push(`${state.tasks.filter((task) => task.status === 'QUEUED').length} work item is waiting to be claimed.`);

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
      affected.status = 'QUEUED';
      affected.assignee = undefined;
      affected.assigneeType = undefined;
      affected.progress = 0;
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
  if (!task || task.status !== 'QUEUED') return state;
  task.status = 'CLAIMED';
  task.assignee = name;
  task.assigneeType = 'HUMAN';
  task.progress = Math.max(task.progress, 5);
  state = addWire(state, 'CREW', 'INFO', `${name} took "${task.title}".`, `claim-${taskId}`);
  return evaluateState(state);
}

export function saveTask(input: EventState, task: CrewTask): EventState {
  let state = structuredClone(input);
  const index = state.tasks.findIndex((candidate) => candidate.id === task.id);
  const normalized = { ...task, progress: Math.max(0, Math.min(100, Number(task.progress) || 0)) };
  if (index >= 0) state.tasks[index] = normalized;
  else state.tasks.push({ ...normalized, id: task.id || `task-${Date.now()}` });
  state = addWire(state, 'TASKS', task.status === 'BLOCKED' ? 'WATCH' : 'INFO', `Work updated: ${task.title} is ${task.status}.`, `task-${task.id}`);
  return evaluateState(state);
}

export function saveProgramItem(input: EventState, item: ProgramItem): EventState {
  let state = structuredClone(input);
  const index = state.program.findIndex((candidate) => candidate.id === item.id);
  if (index >= 0) state.program[index] = { ...item };
  else state.program.push({ ...item, id: item.id || `program-${Date.now()}` });
  state.program.sort((a, b) => a.startMinute - b.startMinute);
  state = addWire(state, 'STAGE', 'INFO', `Lineup saved: ${item.title} at ${formatTime(item.startMinute)}.`, `program-${item.id}`);
  return evaluateState(state);
}

export function moveProgramItem(input: EventState, id: string, direction: -1 | 1): EventState {
  let state = structuredClone(input);
  const ordered = [...state.program].sort((a, b) => a.startMinute - b.startMinute);
  const index = ordered.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ordered.length) return state;
  const currentStart = ordered[index].startMinute;
  ordered[index].startMinute = ordered[target].startMinute;
  ordered[target].startMinute = currentStart;
  state.program = ordered.sort((a, b) => a.startMinute - b.startMinute);
  state = addWire(state, 'STAGE', 'INFO', `Lineup order changed: ${ordered[target].title}.`, `move-${id}`);
  return evaluateState(state);
}

export function substituteProgramItem(input: EventState, id: string, title: string): EventState {
  let state = structuredClone(input);
  const item = state.program.find((candidate) => candidate.id === id);
  if (!item || !title.trim()) return state;
  const previous = item.title;
  item.title = title.trim();
  item.status = 'HOLD';
  item.notes = `Substituted for ${previous}. Confirmation required.`;
  state = addWire(state, 'STAGE', 'ACTION', `${previous} substituted with ${item.title}; confirmation required.`, `sub-${id}`);
  return evaluateState(state);
}

export function saveCrewMember(input: EventState, member: CrewMember): EventState {
  let state = structuredClone(input);
  const index = state.crew.findIndex((candidate) => candidate.id === member.id);
  if (index >= 0) state.crew[index] = { ...member };
  else state.crew.push({ ...member, id: member.id || `crew-${Date.now()}` });
  state = addWire(state, 'CREW', 'INFO', `Staff schedule saved: ${member.name}, ${member.role}.`, `crew-${member.id}`);
  return evaluateState(state);
}

export function setCrewCheckIn(input: EventState, id: string, checkedIn: boolean): EventState {
  let state = structuredClone(input);
  const member = state.crew.find((candidate) => candidate.id === id);
  if (!member) return state;
  member.checkedIn = checkedIn;
  member.available = checkedIn;
  state = addWire(state, 'CREW', checkedIn ? 'INFO' : 'WATCH', `${member.name} ${checkedIn ? 'checked in' : 'checked out'}.`, `checkin-${id}`);
  return evaluateState(state);
}

export function generateMarketingDraft(input: EventState, programItemId: string, platform: MarketingDraft['platform'], actor = { id: 'signal', name: 'Signal' }): EventState {
  let state = structuredClone(input);
  const item = state.program.find((candidate) => candidate.id === programItemId);
  if (!item) return state;
  const draft: MarketingDraft = {
    id: `marketing-${Date.now()}`,
    programItemId: item.id,
    platform,
    publishMinute: Math.max(EVENT_DAY_START, item.startMinute - 20),
    headline: `${item.title} starts in 20 minutes`,
    body: `Head to ${item.venue}. ${item.title} begins at ${formatTime(item.startMinute)}. Open ZAOstock Live Command for the current program and event updates.`,
    status: 'DRAFT',
    createdBy: actor.name,
    createdByConnectionId: actor.id
  };
  state.marketingDrafts.push(draft);
  state = addWire(state, 'MARKETING', 'INFO', `${actor.name} drafted ${platform} coverage for ${item.title}.`, `marketing-${draft.id}`);
  return evaluateState(state);
}

export function updateTaskByAgent(
  input: EventState,
  actor: { id: string; name: string },
  update: Pick<CrewTask, 'id' | 'status'> & Partial<Pick<CrewTask, 'progress' | 'proof' | 'blockedReason'>>
): EventState {
  let state = structuredClone(input);
  const task = state.tasks.find((candidate) => candidate.id === update.id);
  if (!task) throw new Error('Task not found.');
  const isUnclaimed = task.status === 'QUEUED' && !task.assignee;
  const isOwned = task.assigneeType === 'AGENT' && task.assignee === actor.name;
  if (!isUnclaimed && !isOwned) throw new Error('Agent may only claim queued work or update work assigned to itself.');
  if (update.status === 'DONE' && !update.proof?.trim() && !task.proof?.trim()) throw new Error('Proof is required before agent work can be marked DONE.');

  task.assignee = actor.name;
  task.assigneeType = 'AGENT';
  task.status = update.status;
  task.progress = Math.max(0, Math.min(100, Number(update.progress ?? task.progress) || 0));
  if (update.proof?.trim()) task.proof = update.proof.trim().slice(0, 800);
  if (update.blockedReason?.trim()) task.blockedReason = update.blockedReason.trim().slice(0, 500);
  if (update.status !== 'BLOCKED') task.blockedReason = undefined;
  state = addWire(state, 'TASKS', update.status === 'BLOCKED' ? 'WATCH' : 'INFO', `${actor.name} moved “${task.title}” to ${update.status}.`, `agent-task-${task.id}`);
  return evaluateState(state);
}

export function askOperatorQuestion(
  input: EventState,
  actor: { id: string; name: string },
  request: Pick<AgentQuestion, 'question' | 'why' | 'lane' | 'priority'> & { sourcePromptId?: string }
): EventState {
  let state = structuredClone(input);
  const question = request.question.trim().slice(0, 500);
  const why = request.why.trim().slice(0, 800);
  if (!question || !why) throw new Error('Question and why are required.');
  const duplicate = state.agentQuestions.find((item) => item.status === 'OPEN' && (item.sourcePromptId === request.sourcePromptId || item.question.toLowerCase() === question.toLowerCase()));
  if (duplicate) return state;
  state.agentQuestions.push({
    id: `question-${Date.now()}-${crypto.randomUUID()}`,
    sourcePromptId: request.sourcePromptId,
    agentId: actor.id,
    agentName: actor.name,
    lane: request.lane,
    priority: request.priority,
    question,
    why,
    status: 'OPEN',
    createdAt: new Date().toISOString()
  });
  state = addWire(state, 'HERMES', request.priority === 'P0' ? 'ACTION' : 'WATCH', `${actor.name} asked the operator: ${question}`, `question-${actor.id}`);
  return evaluateState(state);
}

export function answerOperatorQuestion(input: EventState, id: string, answer: string, answeredBy: string): EventState {
  let state = structuredClone(input);
  const item = state.agentQuestions.find((candidate) => candidate.id === id);
  if (!item) throw new Error('Question not found.');
  if (!answer.trim()) throw new Error('Answer is required.');
  item.answer = answer.trim().slice(0, 1200);
  item.answeredBy = answeredBy;
  item.answeredAt = new Date().toISOString();
  item.status = 'ANSWERED';
  state = addWire(state, 'HUMAN', 'INFO', `${answeredBy} answered ${item.agentName}'s ${item.lane.toLowerCase()} question.`, `answer-${id}`);
  return evaluateState(state);
}

export function postBlackboardMessage(
  input: EventState,
  actor: { id: string; name: string; type: BlackboardMessage['authorType'] },
  message: Pick<BlackboardMessage, 'lane' | 'text'> & { proof?: string }
): EventState {
  let state = structuredClone(input);
  const text = message.text.trim().slice(0, 1600);
  if (!text) throw new Error('Message text is required.');
  state.blackboard = [...state.blackboard, {
    id: `blackboard-${Date.now()}-${crypto.randomUUID()}`,
    authorId: actor.id,
    authorName: actor.name,
    authorType: actor.type,
    lane: message.lane,
    text,
    createdAt: new Date().toISOString(),
    proof: message.proof?.trim().slice(0, 800) || undefined
  }].slice(-200);
  state = addWire(state, actor.type === 'AGENT' ? 'HERMES' : 'HUMAN', 'INFO', `${actor.name} posted to ${message.lane} on the Blackboard.`, `blackboard-${actor.id}`);
  return evaluateState(state);
}

export function approveMarketingDraft(input: EventState, id: string): EventState {
  let state = structuredClone(input);
  const draft = state.marketingDrafts.find((candidate) => candidate.id === id);
  if (!draft) return state;
  draft.status = 'APPROVED';
  state = addWire(state, 'HUMAN', 'INFO', `Marketing draft approved for ${draft.platform}; no external post sent.`, `marketing-approve-${id}`);
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

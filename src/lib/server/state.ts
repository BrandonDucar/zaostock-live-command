import {
  approveMarketingDraft,
  answerOperatorQuestion,
  postBlackboardMessage,
  approveRecovery,
  claimTask,
  createInitialState,
  generateMarketingDraft,
  hermesAnswer,
  injectScenario,
  moveProgramItem,
  saveTask,
  saveCrewMember,
  saveProgramItem,
  setCrewCheckIn,
  substituteProgramItem
} from '$lib/conductor';
import type { CrewMember, CrewTask, EventState, MarketingDraft, ProgramItem, ScenarioId } from '$lib/types';

type Database = import('@cloudflare/workers-types').D1Database;

export function database(platform: App.Platform | undefined): Database | undefined {
  return platform?.env?.DB;
}

export async function loadState(db?: Database): Promise<{ state: EventState; source: 'D1' | 'FALLBACK' }> {
  if (!db) return { state: createInitialState(), source: 'FALLBACK' };
  const row = await db.prepare('SELECT state_json FROM event_state WHERE event_id = ?1').bind('zaostock-2026').first<{ state_json: string }>();
  if (!row?.state_json) return { state: createInitialState(), source: 'FALLBACK' };

  try {
    const baseline = createInitialState();
    const parsed = JSON.parse(row.state_json) as Partial<EventState>;
    const state: EventState = {
      ...baseline,
      ...parsed,
      program: (parsed.program ?? baseline.program).map((item) => ({
        ...item,
        status: item.status ?? 'HOLD'
      })),
      crew: (parsed.crew ?? baseline.crew).map((member) => ({
        ...member,
        role: member.role ?? member.capability ?? 'Event Staff',
        shiftStartMinute: member.shiftStartMinute ?? 14 * 60,
        shiftEndMinute: member.shiftEndMinute ?? 19 * 60,
        assignment: member.assignment ?? 'Unassigned'
      })),
      tasks: (parsed.tasks ?? baseline.tasks).map((task) => {
        const legacyStatus = String(task.status);
        return { ...task, progress: task.progress ?? (legacyStatus === 'DONE' ? 100 : 0), status: legacyStatus === 'OPEN' ? 'QUEUED' : legacyStatus } as CrewTask;
      }),
      marketingDrafts: parsed.marketingDrafts ?? baseline.marketingDrafts,
      agentQuestions: parsed.agentQuestions ?? baseline.agentQuestions,
      blackboard: parsed.blackboard ?? baseline.blackboard,
      agentConnections: parsed.agentConnections ?? baseline.agentConnections,
      systems: { ...baseline.systems, ...(parsed.systems ?? {}) }
    };
    return { state, source: 'D1' };
  } catch {
    return { state: createInitialState(), source: 'FALLBACK' };
  }
}

export async function saveState(db: Database | undefined, state: EventState): Promise<'D1' | 'MEMORY_ONLY'> {
  if (!db) return 'MEMORY_ONLY';
  await db.prepare(`
    INSERT INTO event_state (event_id, state_json, updated_at)
    VALUES (?1, ?2, CURRENT_TIMESTAMP)
    ON CONFLICT(event_id) DO UPDATE SET state_json = excluded.state_json, updated_at = CURRENT_TIMESTAMP
  `).bind(state.eventId, JSON.stringify(state)).run();

  const latest = state.wire.at(-1);
  if (latest) {
    await db.prepare(`
      INSERT OR IGNORE INTO event_events
      (id, event_id, at_minute, source, severity, message, proof_class, mode)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    `).bind(latest.id, state.eventId, latest.atMinute, latest.source, latest.severity, latest.message, latest.proofClass, state.mode).run();
  }
  return 'D1';
}

export async function mutateState(db: Database | undefined, body: Record<string, unknown>, actor?: { id: string; name: string }): Promise<EventState> {
  const loaded = await loadState(db);
  let state = loaded.state;
  const type = String(body.type ?? '');

  if (type === 'scenario') state = injectScenario(state, String(body.scenario) as ScenarioId);
  else if (type === 'approve') state = approveRecovery(state, String(body.optionId ?? ''));
  else if (type === 'claim') state = claimTask(state, String(body.taskId ?? ''), String(body.name ?? 'Crew'));
  else if (type === 'program_save') state = saveProgramItem(state, body.item as ProgramItem);
  else if (type === 'program_move') state = moveProgramItem(state, String(body.id ?? ''), Number(body.direction) < 0 ? -1 : 1);
  else if (type === 'program_substitute') state = substituteProgramItem(state, String(body.id ?? ''), String(body.title ?? ''));
  else if (type === 'crew_save') state = saveCrewMember(state, body.member as CrewMember);
  else if (type === 'crew_checkin') state = setCrewCheckIn(state, String(body.id ?? ''), Boolean(body.checkedIn));
  else if (type === 'task_save') state = saveTask(state, body.task as CrewTask);
  else if (type === 'marketing_generate') state = generateMarketingDraft(state, String(body.programItemId ?? ''), String(body.platform ?? 'FARCASTER') as MarketingDraft['platform'], actor);
  else if (type === 'marketing_approve') state = approveMarketingDraft(state, String(body.id ?? ''));
  else if (type === 'question_answer') state = answerOperatorQuestion(state, String(body.id ?? ''), String(body.answer ?? ''), actor?.name ?? 'Organizer');
  else if (type === 'blackboard_post') state = postBlackboardMessage(state, { id: actor?.id ?? 'organizer', name: actor?.name ?? 'Organizer', type: 'HUMAN' }, { lane: String(body.lane ?? 'ALL') as 'ALL' | 'CREW' | 'MARKETING' | 'STAGE' | 'MEDIA', text: String(body.text ?? ''), proof: body.proof ? String(body.proof) : undefined });
  else if (type === 'reset') state = createInitialState();
  else throw new Error('Unsupported mutation type.');

  await saveState(db, state);
  return state;
}

export async function answerQuestion(db: Database | undefined, question: string): Promise<{ answer: string; state: EventState }> {
  const { state } = await loadState(db);
  return { answer: hermesAnswer(state, question), state };
}

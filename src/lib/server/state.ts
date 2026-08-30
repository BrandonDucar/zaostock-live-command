import { approveRecovery, claimTask, createInitialState, hermesAnswer, injectScenario } from '$lib/conductor';
import type { EventState, ScenarioId } from '$lib/types';

type Database = import('@cloudflare/workers-types').D1Database;

export function database(platform: App.Platform | undefined): Database | undefined {
  return platform?.env?.DB;
}

export async function loadState(db?: Database): Promise<{ state: EventState; source: 'D1' | 'FALLBACK' }> {
  if (!db) return { state: createInitialState(), source: 'FALLBACK' };
  const row = await db.prepare('SELECT state_json FROM event_state WHERE event_id = ?1').bind('zaostock-2026').first<{ state_json: string }>();
  if (!row?.state_json) return { state: createInitialState(), source: 'FALLBACK' };

  try {
    return { state: JSON.parse(row.state_json) as EventState, source: 'D1' };
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

export async function mutateState(db: Database | undefined, body: Record<string, unknown>): Promise<EventState> {
  const loaded = await loadState(db);
  let state = loaded.state;
  const type = String(body.type ?? '');

  if (type === 'scenario') state = injectScenario(state, String(body.scenario) as ScenarioId);
  else if (type === 'approve') state = approveRecovery(state, String(body.optionId ?? ''));
  else if (type === 'claim') state = claimTask(state, String(body.taskId ?? ''), String(body.name ?? 'Crew'));
  else if (type === 'reset') state = createInitialState();
  else throw new Error('Unsupported mutation. Use scenario, approve, claim, or reset.');

  await saveState(db, state);
  return state;
}

export async function answerQuestion(db: Database | undefined, question: string): Promise<{ answer: string; state: EventState }> {
  const { state } = await loadState(db);
  return { answer: hermesAnswer(state, question), state };
}


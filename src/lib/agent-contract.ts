import type { EventState, ReversePrompt } from './types';

export const PUBLIC_REPOSITORY = 'https://github.com/BrandonDucar/zaostock-live-command';

export const agentProfiles = {
  OBSERVER: {
    label: 'Observer',
    scopes: ['read:state', 'read:events', 'ask:hermes', 'ask:operator', 'read:blackboard', 'write:blackboard'],
    summary: 'Reads shared event Reality, monitors risks, and can ask the operator a bounded question.'
  },
  CREW: {
    label: 'Crew operator',
    scopes: ['read:state', 'read:events', 'ask:hermes', 'ask:operator', 'read:blackboard', 'write:blackboard', 'write:crew_tasks'],
    summary: 'Claims and advances queued crew work, records blockers, and submits proof.'
  },
  MARKETING: {
    label: 'Marketing',
    scopes: ['read:state', 'read:events', 'ask:hermes', 'ask:operator', 'read:blackboard', 'write:blackboard', 'write:marketing_drafts'],
    summary: 'Creates evidence-grounded marketing drafts. Approval and publishing remain human-gated.'
  }
} as const;

export type AgentProfileId = keyof typeof agentProfiles;

export function isAgentProfile(value: string): value is AgentProfileId {
  return Object.hasOwn(agentProfiles, value);
}

export function scopesForProfile(value: string): string[] {
  return [...agentProfiles[isAgentProfile(value) ? value : 'OBSERVER'].scopes];
}

export function reversePromptsFor(state: EventState, scopes: string[]): ReversePrompt[] {
  const candidates: ReversePrompt[] = [];
  const openPromptIds = new Set(state.agentQuestions.filter((item) => item.status === 'OPEN').map((item) => item.sourcePromptId));

  if (scopes.includes('write:crew_tasks')) {
    const blocked = state.tasks.find((task) => task.status === 'BLOCKED');
    if (blocked) {
      candidates.push({
        id: `crew-unblock-${blocked.id}`,
        lane: 'CREW',
        priority: 'P0',
        question: `What is the smallest missing input needed to unblock “${blocked.title}”?`,
        why: blocked.blockedReason ?? 'The task is blocked and the agent cannot safely infer the missing real-world input.',
        unlocks: `A concrete next action for ${blocked.id}`
      });
    }
    if (!state.crew.some((member) => member.capability === 'SAFETY')) {
      candidates.push({
        id: 'crew-safety-owner',
        lane: 'CREW',
        priority: 'P1',
        question: 'Who owns event-day safety escalation, and what is the fastest approved way to reach them?',
        why: 'No SAFETY capability is represented on the current staff board.',
        unlocks: 'A named safety escalation path'
      });
    }
  }

  if (scopes.includes('write:marketing_drafts')) {
    const confirmed = state.program.filter((item) => ['CONFIRMED', 'ARRIVED', 'LIVE', 'COMPLETE'].includes(item.status));
    if (!confirmed.length) {
      candidates.push({
        id: 'marketing-public-lineup',
        lane: 'MARKETING',
        priority: 'P0',
        question: 'Which acts or program items are approved for public naming right now?',
        why: 'Every current program item is still HOLD, so a marketing agent must not convert rehearsal fixtures into public claims.',
        unlocks: 'A truthful first lineup draft'
      });
    }
    if (!state.marketingDrafts.some((draft) => draft.status === 'APPROVED')) {
      candidates.push({
        id: 'marketing-first-message',
        lane: 'MARKETING',
        priority: 'P1',
        question: 'What is the single audience action the first approved announcement should drive?',
        why: 'Drafts exist, but no public message has an approved conversion goal.',
        unlocks: 'A focused call to action without authorizing publication'
      });
    }
  }

  return candidates.filter((candidate) => !openPromptIds.has(candidate.id));
}

export function actionCatalog(origin: string) {
  return {
    orient: { method: 'GET', url: `${origin}/api/v1/agents/context`, scope: 'valid bearer token' },
    askOperator: { method: 'POST', url: `${origin}/api/v1/agents/questions`, scope: 'ask:operator' },
    postBlackboard: { method: 'POST', url: `${origin}/api/v1/agents/messages`, scope: 'write:blackboard' },
    updateCrewTask: { method: 'POST', url: `${origin}/api/v1/agents/tasks`, scope: 'write:crew_tasks' },
    createMarketingDraft: { method: 'POST', url: `${origin}/api/v1/state`, scope: 'write:marketing_drafts', bodyType: 'marketing_generate' },
    readState: { method: 'GET', url: `${origin}/api/v1/state`, scope: 'public' },
    readEvents: { method: 'GET', url: `${origin}/api/v1/events`, scope: 'public' },
    askConductor: { method: 'POST', url: `${origin}/api/v1/ask`, scope: 'public' }
  };
}

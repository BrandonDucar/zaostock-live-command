import { describe, expect, it } from 'vitest';
import { approveRecovery, askOperatorQuestion, claimTask, createInitialState, hermesAnswer, injectScenario, postBlackboardMessage, updateTaskByAgent } from './conductor';
import { reversePromptsFor } from './agent-contract';

describe('Hermes conductor', () => {
  it('requires human approval when stage drift threatens the hard start', () => {
    const state = injectScenario(createInitialState(), 'artist-delay');
    expect(state.scheduleDriftMinutes).toBe(13);
    expect(state.systems.STAGE).toBe('DEGRADED');
    expect(state.hermes.awaitingApproval).toBe(true);
    expect(state.hermes.recoveryOptions).toHaveLength(3);
    expect(state.pulse).toBeLessThan(85);
  });

  it('recovers buffer only after explicit approval', () => {
    const disrupted = injectScenario(createInitialState(), 'artist-delay');
    const recovered = approveRecovery(disrupted, 'recover-buffer');
    expect(recovered.scheduleDriftMinutes).toBe(7);
    expect(recovered.wire.at(-1)?.message).toContain('propagated');
  });

  it('finds an available content replacement for a no-show', () => {
    const state = injectScenario(createInitialState(), 'volunteer-no-show');
    expect(state.systems.CREW).toBe('DEGRADED');
    expect(state.hermes.recommendation).toContain('Alex');
    expect(hermesAnswer(state, 'Who can cover content?')).toContain('Alex');
  });

  it('keeps stream failure at reversible intervention level', () => {
    const state = injectScenario(createInitialState(), 'stream-down');
    expect(state.systems.MEDIA).toBe('OFFLINE');
    expect(state.hermes.awaitingApproval).toBe(false);
    expect(state.hermes.recoveryOptions[0]?.interventionLevel).toBe(2);
  });

  it('lets crew claim an open bounded task', () => {
    const state = claimTask(createInitialState(), 'task-staff', 'Alex');
    expect(state.tasks.find((task) => task.id === 'task-staff')?.status).toBe('CLAIMED');
    expect(state.wire.at(-1)?.message).toContain('Alex');
  });

  it('lets a scoped crew agent claim its own work and requires proof to finish', () => {
    const claimed = updateTaskByAgent(createInitialState(), { id: 'agent-1', name: 'Outside Crew' }, { id: 'task-staff', status: 'CLAIMED', progress: 5 });
    expect(claimed.tasks.find((task) => task.id === 'task-staff')?.assigneeType).toBe('AGENT');
    expect(() => updateTaskByAgent(claimed, { id: 'agent-1', name: 'Outside Crew' }, { id: 'task-staff', status: 'DONE', progress: 100 })).toThrow('Proof is required');
  });

  it('turns missing reality into a deduplicated operator question', () => {
    const state = createInitialState();
    const prompts = reversePromptsFor(state, ['write:marketing_drafts']);
    expect(prompts.some((prompt) => prompt.id === 'marketing-public-lineup')).toBe(true);
    const asked = askOperatorQuestion(state, { id: 'agent-2', name: 'Outside Marketing' }, { ...prompts[0] });
    const duplicate = askOperatorQuestion(asked, { id: 'agent-2', name: 'Outside Marketing' }, { ...prompts[0] });
    expect(duplicate.agentQuestions).toHaveLength(1);
  });

  it('records attributed agent communication on the Blackboard', () => {
    const state = postBlackboardMessage(createInitialState(), { id: 'agent-3', name: 'Outside Agent', type: 'AGENT' }, { lane: 'ALL', text: 'I found a blocked task.' });
    expect(state.blackboard.at(-1)).toMatchObject({ authorName: 'Outside Agent', authorType: 'AGENT', lane: 'ALL' });
  });
});

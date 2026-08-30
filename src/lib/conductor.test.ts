import { describe, expect, it } from 'vitest';
import { approveRecovery, claimTask, createInitialState, hermesAnswer, injectScenario } from './conductor';

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
});

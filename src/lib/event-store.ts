import { writable } from 'svelte/store';
import { approveRecovery, claimTask, createInitialState, injectScenario, tick } from './conductor';
import type { EventMode, EventState, ScenarioId } from './types';

function createEventStore() {
  const { subscribe, set, update } = writable<EventState>(createInitialState());

  return {
    subscribe,
    reset: () => set(createInitialState()),
    setMode: (mode: EventMode) => update((state) => ({ ...state, mode })),
    tick: (seconds = 1) => update((state) => tick(state, seconds)),
    inject: (scenario: ScenarioId) => update((state) => injectScenario(state, scenario)),
    approve: (optionId: string) => update((state) => approveRecovery(state, optionId)),
    claim: (taskId: string, name: string) => update((state) => claimTask(state, taskId, name)),
    hydrate: (state: EventState) => set(state)
  };
}

export const eventStore = createEventStore();


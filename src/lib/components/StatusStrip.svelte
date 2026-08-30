<script lang="ts">
  import { eventStore } from '$lib/event-store';
  import type { SystemName } from '$lib/types';

  const systems: SystemName[] = ['STAGE', 'CREW', 'BATTLE', 'MEDIA', 'TASKS', 'MARKETING', 'PROOF'];
</script>

<div class="status-strip" aria-label="Festival system status">
  {#each systems as system}
    <div class="status-item" title={`${system}: ${$eventStore.systems[system]}`}>
      <span class:healthy={$eventStore.systems[system] === 'HEALTHY'} class:watch={$eventStore.systems[system] === 'WATCH'} class:degraded={$eventStore.systems[system] === 'DEGRADED'} class:offline={$eventStore.systems[system] === 'OFFLINE'}></span>
      <strong>{system}</strong>
      <small>{$eventStore.systems[system]}</small>
    </div>
  {/each}
</div>

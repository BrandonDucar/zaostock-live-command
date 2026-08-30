<script lang="ts">
  import { formatTime } from '$lib/conductor';
  import type { WireEvent } from '$lib/types';

  let { events, compact = false }: { events: WireEvent[]; compact?: boolean } = $props();
</script>

<section class:compact class="live-wire">
  <header>
    <span class="signal"></span>
    <div>
      <p class="eyebrow">EVENT NERVOUS SYSTEM</p>
      <h2>Live Wire</h2>
    </div>
    <span class="live-label">LIVE</span>
  </header>
  <div class="wire-list">
    {#each [...events].reverse() as item, index}
      <article class:latest={index === 0}>
        <time>{formatTime(item.atMinute)}</time>
        <strong>{item.source}</strong>
        <p>{item.message}</p>
        <span class={`severity ${item.severity.toLowerCase()}`}>{item.severity}</span>
      </article>
    {/each}
  </div>
</section>


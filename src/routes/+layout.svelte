<script lang="ts">
  import AppShell from '$lib/components/AppShell.svelte';
  import '../styles.css';

  let { children } = $props();
</script>

<AppShell>
  {@render children()}
</AppShell>


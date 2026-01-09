<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { Database } from '$lib/database.js';
	import { browser } from '$app/environment';

	let { children } = $props();

	onMount(async () => {
		if (browser) {
			await Database.init();
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>DSA Tracker</title>
</svelte:head>

{@render children()}

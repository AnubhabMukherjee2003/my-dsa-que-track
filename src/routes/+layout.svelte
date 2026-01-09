<script>
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

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background-color: #f5f5f5;
		color: #333;
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(.btn) {
		padding: 8px 16px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: background-color 0.2s;
	}

	:global(.btn-primary) {
		background-color: #007bff;
		color: white;
	}

	:global(.btn-primary:hover) {
		background-color: #0056b3;
	}

	:global(.btn-secondary) {
		background-color: #6c757d;
		color: white;
	}

	:global(.btn-secondary:hover) {
		background-color: #545b62;
	}

	:global(.btn-danger) {
		background-color: #dc3545;
		color: white;
	}

	:global(.btn-danger:hover) {
		background-color: #c82333;
	}

	:global(.btn-success) {
		background-color: #28a745;
		color: white;
	}

	:global(.btn-success:hover) {
		background-color: #1e7e34;
	}

	:global(.form-control) {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 14px;
	}

	:global(.form-control:focus) {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	:global(.modal-overlay) {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	:global(.modal) {
		background: white;
		border-radius: 8px;
		padding: 24px;
		max-width: 500px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
	}

	:global(.progress-bar) {
		width: 100%;
		height: 8px;
		background-color: #e9ecef;
		border-radius: 4px;
		overflow: hidden;
	}

	:global(.progress-fill) {
		height: 100%;
		background-color: #28a745;
		transition: width 0.3s ease;
	}
</style>

{@render children()}

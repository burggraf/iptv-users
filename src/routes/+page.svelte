<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import ProviderDialog from '$lib/components/provider-dialog.svelte';
	import { getProviders, deleteProvider, providers, checkProviderUserInfo } from '$lib/pocketbase';
	import type { IPTVProvider } from '$lib/types';
	import { onMount } from 'svelte';

	let loading = true;
	let error = '';
	let searchQuery = '';
	let dialogOpen = false;
	let selectedProvider: IPTVProvider | null = null;

	async function loadProviders() {
		try {
			await getProviders();
			error = '';
		} catch (err) {
			console.error('Error loading providers:', err);
			error = 'Failed to load providers. Please try again.';
		} finally {
			loading = false;
		}
	}

	onMount(loadProviders);

	function filterProviders(providers: IPTVProvider[]) {
		if (!searchQuery) return providers;
		const query = searchQuery.toLowerCase();
		return providers.filter(
			(provider) =>
				provider.name.toLowerCase().includes(query) ||
				provider.username.toLowerCase().includes(query) ||
				provider.server_url.toLowerCase().includes(query)
		);
	}

	async function handleDelete(provider: IPTVProvider) {
		if (!confirm(`Are you sure you want to delete ${provider.name}?`)) {
			return;
		}

		try {
			await deleteProvider(provider.id);
		} catch (err) {
			console.error('Error deleting provider:', err);
			error = 'Failed to delete provider. Please try again.';
		}
	}

	function handleEdit(provider: IPTVProvider) {
		selectedProvider = provider;
		dialogOpen = true;
	}

	async function handleCheckInfo(provider: IPTVProvider) {
		try {
			const info = await checkProviderUserInfo(provider);
			console.log('Provider user info:', info);
		} catch (err) {
			console.error('Error checking provider info:', err);
			error = 'Failed to check provider info. Please verify the connection details.';
		}
	}

	function handleAdd() {
		selectedProvider = null;
		dialogOpen = true;
	}
</script>

<div class="container mx-auto py-10">
	<h1 class="mb-6 text-4xl font-bold">IPTV Providers Management</h1>

	<div class="mb-6 flex justify-between">
		<div class="w-1/3">
			<Input type="text" placeholder="Search providers..." bind:value={searchQuery} />
		</div>
		<Button on:click={handleAdd}>Add New Provider</Button>
	</div>

	{#if error}
		<Alert variant="destructive" class="mb-4">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if loading}
		<p>Loading providers...</p>
	{:else}
		<Card>
			<CardHeader>
				<CardTitle>Providers</CardTitle>
				<CardDescription>Manage your IPTV providers and their connection details</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Username</TableHead>
							<TableHead>Server URL</TableHead>
							<TableHead>Protocol</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Max Connections</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each filterProviders($providers) as provider (provider.id)}
							<TableRow>
								<TableCell>{provider.name}</TableCell>
								<TableCell>{provider.username}</TableCell>
								<TableCell>{provider.server_url}</TableCell>
								<TableCell>{provider.server_protocol.toUpperCase()}</TableCell>
								<TableCell>{provider.status}</TableCell>
								<TableCell>{provider.max_connections}</TableCell>
								<TableCell class="flex gap-2">
									<Button variant="outline" size="sm" on:click={() => handleEdit(provider)}
										>Edit</Button
									>
									<Button variant="outline" size="sm" on:click={() => handleCheckInfo(provider)}
										>Check Info</Button
									>
									<Button
										variant="outline"
										size="sm"
										class="text-red-600"
										on:click={() => handleDelete(provider)}>Delete</Button
									>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	{/if}
</div>

<ProviderDialog
	open={dialogOpen}
	onOpenChange={(open) => (dialogOpen = open)}
	provider={selectedProvider}
	onSuccess={loadProviders}
/>

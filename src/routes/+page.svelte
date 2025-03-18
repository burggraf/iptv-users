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
	import {
		getProviders,
		deleteProvider,
		providers,
		checkProviderUserInfo,
		syncCategories,
		syncChannels,
		pb
	} from '$lib/pocketbase';
	import type { IPTVProvider } from '$lib/types';
	import { onMount } from 'svelte';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';

	let loading = true;
	let error = '';
	let success = '';
	let searchQuery = '';
	let dialogOpen = false;
	let selectedProvider: IPTVProvider | null = null;
	let syncing: { [key: string]: boolean } = {};
	let providerStats: { [key: string]: { categories: number; channels: number } } = {};

	let messageTimeout: NodeJS.Timeout;

	async function loadProviderStats() {
		for (const provider of $providers) {
			try {
				const [categories, channels] = await Promise.all([
					pb.collection('categories').getList(1, 1, {
						filter: `provider_id = "${provider.id}"`,
						fields: 'id'
					}),
					pb.collection('channels').getList(1, 1, {
						filter: `provider_id = "${provider.id}"`,
						fields: 'id'
					})
				]);
				providerStats[provider.id] = {
					categories: categories.totalItems,
					channels: channels.totalItems
				};
			} catch (err) {
				console.error('Error loading stats for provider:', provider.id, err);
			}
		}
	}

	function showMessage(message: string, isError = false) {
		if (messageTimeout) clearTimeout(messageTimeout);
		if (isError) {
			error = message;
			success = '';
		} else {
			success = message;
			error = '';
		}
		messageTimeout = setTimeout(() => {
			error = '';
			success = '';
		}, 3000);
	}

	async function loadProviders() {
		try {
			await getProviders();
			await loadProviderStats();
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

	async function handleSyncCategories(provider: IPTVProvider) {
		if (syncing[provider.id]) return;
		syncing[provider.id] = true;

		try {
			await syncCategories(provider);
			await loadProviderStats(); // Refresh stats after sync
			showMessage(`Successfully synced categories for ${provider.name}`);
		} catch (err) {
			console.error('Error syncing categories:', err);
			showMessage('Failed to sync categories. Please try again.', true);
		} finally {
			syncing[provider.id] = false;
		}
	}

	async function handleSyncChannels(provider: IPTVProvider) {
		if (syncing[provider.id]) return;
		syncing[provider.id] = true;

		try {
			await syncChannels(provider);
			await loadProviderStats(); // Refresh stats after sync
			showMessage(`Successfully synced channels for ${provider.name}`);
		} catch (err) {
			console.error('Error syncing channels:', err);
			showMessage('Failed to sync channels. Please try again.', true);
		} finally {
			syncing[provider.id] = false;
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
		<Button onclick={handleAdd}>Add New Provider</Button>
	</div>

	{#if error}
		<Alert variant="destructive" class="mb-4">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if success}
		<Alert variant="default" class="mb-4 bg-green-50">
			<AlertDescription class="text-green-800">{success}</AlertDescription>
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
							<TableHead>Status</TableHead>
							<TableHead>Categories</TableHead>
							<TableHead>Channels</TableHead>
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
								<TableCell>{provider.status}</TableCell>
								<TableCell>{providerStats[provider.id]?.categories ?? 0}</TableCell>
								<TableCell>{providerStats[provider.id]?.channels ?? 0}</TableCell>
								<TableCell>{provider.max_connections}</TableCell>
								<TableCell class="flex gap-2">
									<DropdownMenu>
										<DropdownMenuTrigger>
											<Button variant="outline" size="sm">Actions</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onSelect={() => handleEdit(provider)}>
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem onSelect={() => handleCheckInfo(provider)}>
												Check Info
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												disabled={syncing[provider.id]}
												onSelect={() => handleSyncCategories(provider)}
											>
												{syncing[provider.id] ? 'Syncing Categories...' : 'Sync Categories'}
											</DropdownMenuItem>
											<DropdownMenuItem
												disabled={syncing[provider.id]}
												onSelect={() => handleSyncChannels(provider)}
											>
												{syncing[provider.id] ? 'Syncing Channels...' : 'Sync Channels'}
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onSelect={() => handleDelete(provider)}
												class="text-red-600"
											>
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
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

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
		pb,
		getAuthHeaders
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
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion';
	import { FlaskConical } from 'lucide-svelte';
	import { format } from 'date-fns';

	let loading = true;
	let error = '';
	let success = '';
	let searchQuery = '';
	let dialogOpen = false;
	let selectedProvider: IPTVProvider | null = null;
	let syncing: { [key: string]: boolean } = {};
	let providerStats: { [key: string]: { categories: number; channels: number } } = {};
	let loadedCategories: { [key: string]: any[] } = {};
	let loadedChannels: { [key: string]: any[] } = {};
	let expandedCategories: Set<string> = new Set();
	let validatingChannel: { [key: string]: boolean } = {};

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

	async function loadProviderCategories(providerId: string) {
		if (!loadedCategories[providerId]) {
			try {
				// Get all categories for this provider
				const categoriesResult = await pb.collection('categories').getList(1, 500, {
					filter: `provider_id = "${providerId}"`,
					sort: 'name'
				});

				// Get all channel counts in one query using the SvelteKit API endpoint
				const channelCountsResponse = await fetch('/api/channel-counts', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						providerId,
						categoryIds: categoriesResult.items.map((cat) => cat.id)
					})
				});

				if (!channelCountsResponse.ok) {
					throw new Error(`Failed to get channel counts: ${channelCountsResponse.statusText}`);
				}

				const channelCountsResult = await channelCountsResponse.json();

				// Map the categories with their counts
				loadedCategories[providerId] = categoriesResult.items.map((category) => ({
					...category,
					channelCount: channelCountsResult[category.id] || 0
				}));
			} catch (err: any) {
				console.error('Error loading categories:', err);
				error = 'Failed to load categories. Please try again.';
			}
		}
	}

	async function loadCategoryChannels(providerId: string, categoryId: string) {
		const cacheKey = `${categoryId}`;
		if (!loadedChannels[cacheKey]) {
			try {
				const channelsResult = await pb.collection('channels').getList(1, 500, {
					filter: `provider_id = "${providerId}" && category_id = "${categoryId}"`,
					sort: 'name'
				});
				loadedChannels[cacheKey] = channelsResult.items;
			} catch (err) {
				console.error('Error loading channels:', err);
				error = 'Failed to load channels. Please try again.';
			}
		}
	}

	async function toggleCategoryChannels(providerId: string, categoryId: string) {
		if (expandedCategories.has(categoryId)) {
			expandedCategories.delete(categoryId);
			expandedCategories = expandedCategories; // Trigger Svelte reactivity
		} else {
			await loadCategoryChannels(providerId, categoryId);
			expandedCategories.add(categoryId);
			expandedCategories = expandedCategories; // Trigger Svelte reactivity
		}
	}

	async function validateChannel(channel: any) {
		const channelId = channel.id;
		console.log('Validating channel:', channelId, channel);

		if (validatingChannel[channelId]) {
			console.log('Channel validation already in progress');
			return;
		}

		validatingChannel[channelId] = true;
		try {
			console.log('Making validation request to:', '/api/validate-channel');
			const response = await fetch('/api/validate-channel', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders()
				},
				body: JSON.stringify({ channelId })
			});

			console.log('Validation response:', {
				ok: response.ok,
				status: response.status,
				statusText: response.statusText
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Validation error response:', errorText);
				throw new Error(`Validation failed: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();
			console.log('Validation result:', result);

			// Refresh the channel data
			console.log('Fetching updated channel data');
			const updatedChannel = await pb.collection('channels').getOne(channelId);
			console.log('Updated channel data:', updatedChannel);

			// Update the channel in the loadedChannels array
			const categoryId = channel.category_id;
			loadedChannels[categoryId] = loadedChannels[categoryId].map((ch) =>
				ch.id === channelId ? updatedChannel : ch
			);
			loadedChannels = loadedChannels; // Trigger reactivity
		} catch (err) {
			console.error('Error validating channel:', {
				error: err,
				message: err.message,
				stack: err.stack
			});
			error = 'Failed to validate channel. Please try again.';
		} finally {
			validatingChannel[channelId] = false;
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

	async function testApi() {
		try {
			console.log('Testing API endpoint...');
			const response = await fetch('/api/test');
			console.log('API Response status:', response.status);
			const data = await response.json();
			console.log('API Response:', data);
		} catch (error) {
			console.error('API Test Error:', error);
		}
	}
</script>

<div class="container mx-auto py-10">
	<h1 class="mb-6 text-4xl font-bold">IPTV Providers Management</h1>

	<div class="mb-6 flex items-center justify-between">
		<div class="w-1/3">
			<Input type="text" placeholder="Search providers..." bind:value={searchQuery} />
		</div>
		<div class="flex gap-2">
			<Button on:click={testApi} variant="outline">Test API</Button>
			<Button on:click={handleAdd}>Add New Provider</Button>
		</div>
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
				<Accordion>
					{#each filterProviders($providers) as provider (provider.id)}
						<AccordionItem value={provider.id}>
							<AccordionTrigger
								on:click={() => loadProviderCategories(provider.id)}
								class="grid w-full grid-cols-6"
							>
								<div class="flex items-center gap-4">
									<span class="font-medium">{provider.name}</span>
								</div>
								<span class={provider.status === 'Active' ? 'text-green-600' : 'text-red-600'}>
									{provider.status}
								</span>
								<span>{providerStats[provider.id]?.categories ?? 0} Categories</span>
								<span>{providerStats[provider.id]?.channels ?? 0} Channels</span>
								<span>{provider.max_connections} Connections</span>
								<div class="flex justify-end">
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
								</div>
							</AccordionTrigger>
							<AccordionContent>
								{#if loadedCategories[provider.id]}
									<div class="mt-4">
										<h4 class="mb-2 text-sm font-semibold">Categories</h4>
										<div class="space-y-2">
											{#each loadedCategories[provider.id] as category}
												<div class="rounded-md border p-4">
													<button
														class="flex w-full items-center justify-between"
														on:click={() => toggleCategoryChannels(provider.id, category.id)}
													>
														<div>
															<h5 class="font-medium">{category.name}</h5>
															<p class="text-sm text-muted-foreground">
																Type: {category.category_type} • {category.channelCount} channels
															</p>
														</div>
														<Button variant="ghost" size="sm" class="gap-2">
															{#if expandedCategories.has(category.id)}
																Hide Channels
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	width="16"
																	height="16"
																	viewBox="0 0 24 24"
																	fill="none"
																	stroke="currentColor"
																	stroke-width="2"
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	class="rotate-180 transition-transform"
																>
																	<polyline points="6 9 12 15 18 9"></polyline>
																</svg>
															{:else}
																View Channels
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	width="16"
																	height="16"
																	viewBox="0 0 24 24"
																	fill="none"
																	stroke="currentColor"
																	stroke-width="2"
																	stroke-linecap="round"
																	stroke-linejoin="round"
																>
																	<polyline points="6 9 12 15 18 9"></polyline>
																</svg>
															{/if}
														</Button>
													</button>

													{#if expandedCategories.has(category.id)}
														{#if loadedChannels[category.id]}
															<div class="mt-4 border-l pl-4">
																<div class="mb-2 flex items-center justify-between">
																	<h6 class="text-sm font-medium">Channels</h6>
																	<span class="text-xs text-muted-foreground">
																		{loadedChannels[category.id].length} channels
																	</span>
																</div>
																<div class="space-y-1">
																	{#each loadedChannels[category.id] as channel}
																		<div
																			class="flex items-center justify-between rounded bg-muted p-2 text-sm"
																		>
																			<div class="flex-1">
																				<div>{channel.name}</div>
																				{#if channel.validation_date}
																					<div class="text-xs text-muted-foreground">
																						Validated: {format(
																							new Date(channel.validation_date),
																							'MMM d, yyyy HH:mm'
																						)}
																						{#if channel.validation_result}
																							<span
																								class={channel.validation_result.valid
																									? 'text-green-600'
																									: 'text-red-600'}
																							>
																								• {channel.validation_result.valid
																									? 'Valid'
																									: 'Invalid'}
																								{#if channel.validation_result.error}
																									- {channel.validation_result.error}
																								{/if}
																							</span>
																						{/if}
																					</div>
																				{/if}
																			</div>
																			<button
																				class="ml-2 rounded p-1 transition-colors hover:bg-background"
																				on:click={() => validateChannel(channel)}
																				disabled={validatingChannel[channel.id]}
																			>
																				<FlaskConical
																					size={16}
																					class={validatingChannel[channel.id]
																						? 'animate-spin text-muted-foreground'
																						: ''}
																				/>
																			</button>
																		</div>
																	{/each}
																</div>
															</div>
														{:else}
															<div class="flex items-center justify-center py-4">
																<span class="text-muted-foreground">Loading channels...</span>
															</div>
														{/if}
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="flex items-center justify-center py-8">
										<span class="text-muted-foreground">Loading categories...</span>
									</div>
								{/if}
							</AccordionContent>
						</AccordionItem>
					{/each}
				</Accordion>
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

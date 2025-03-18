<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		createProvider,
		updateProvider,
		checkProviderUserInfo,
		syncCategories,
		syncChannels
	} from '$lib/pocketbase';
	import type { IPTVProvider } from '$lib/types';

	export let open = false;
	export let onOpenChange: (open: boolean) => void;
	export let provider: Partial<IPTVProvider> | null = null;
	export let onSuccess: () => void;

	let loading = false;
	let error = '';

	// Form fields
	let name = '';
	let username = '';
	let password = '';
	let message = '';
	let server_url = '';
	let server_port = '';
	let https_port = '';
	let server_protocol = 'http';
	let rtmp_port = '';
	let max_connections = 1;
	let timezone = 'UTC';
	let allowed_output_formats = ['m3u8', 'ts'];

	$: if (provider) {
		name = provider.name || '';
		username = provider.username || '';
		password = provider.password || '';
		message = provider.message || '';
		server_url = provider.server_url || '';
		server_port = provider.server_port || '';
		https_port = provider.https_port || '';
		server_protocol = provider.server_protocol || 'http';
		rtmp_port = provider.rtmp_port || '';
		max_connections = provider.max_connections || 1;
		timezone = provider.timezone || 'UTC';
		allowed_output_formats = provider.allowed_output_formats || ['m3u8', 'ts'];
	}

	function resetForm() {
		name = '';
		username = '';
		password = '';
		message = '';
		server_url = '';
		server_port = '';
		https_port = '';
		server_protocol = 'http';
		rtmp_port = '';
		max_connections = 1;
		timezone = 'UTC';
		allowed_output_formats = ['m3u8', 'ts'];
		error = '';
	}

	$: if (!open) {
		resetForm();
	}

	async function handleSubmit() {
		loading = true;
		error = '';

		try {
			const providerData = {
				name,
				username,
				password,
				message,
				auth: 1,
				status: 'Active',
				server_url,
				server_port,
				https_port,
				server_protocol,
				rtmp_port,
				max_connections,
				timezone,
				allowed_output_formats,
				is_trial: '0',
				active_cons: '0'
			};

			let savedProvider;
			if (provider?.id) {
				savedProvider = await updateProvider(provider.id, providerData);
			} else {
				savedProvider = await createProvider(providerData);
				// After creating a new provider, check info and sync data if active
				try {
					// Create an IPTVProvider object from the saved record
					const providerForCheck: IPTVProvider = {
						...savedProvider,
						...providerData,
						id: savedProvider.id,
						exp_date: '',
						created_at: new Date().toISOString(),
						user_id: savedProvider.user_id,
						xui: false,
						version: '',
						revision: 0,
						timestamp_now: 0,
						time_now: ''
					};

					// Check provider info
					await checkProviderUserInfo(providerForCheck);

					// If the provider status is Active after checking info, sync categories and channels
					const updatedProviderRecord = await updateProvider(savedProvider.id, {});
					if (updatedProviderRecord.status === 'Active') {
						// Create a properly typed IPTVProvider object
						const updatedProvider: IPTVProvider = {
							...updatedProviderRecord,
							id: updatedProviderRecord.id,
							name: updatedProviderRecord.name,
							username: updatedProviderRecord.username,
							password: updatedProviderRecord.password,
							message: updatedProviderRecord.message,
							auth: updatedProviderRecord.auth,
							status: updatedProviderRecord.status,
							exp_date: updatedProviderRecord.exp_date || '',
							is_trial: updatedProviderRecord.is_trial,
							active_cons: updatedProviderRecord.active_cons,
							created_at: updatedProviderRecord.created_at,
							max_connections: updatedProviderRecord.max_connections,
							allowed_output_formats: updatedProviderRecord.allowed_output_formats,
							server_url: updatedProviderRecord.server_url,
							server_port: updatedProviderRecord.server_port,
							https_port: updatedProviderRecord.https_port,
							server_protocol: updatedProviderRecord.server_protocol,
							rtmp_port: updatedProviderRecord.rtmp_port,
							timezone: updatedProviderRecord.timezone,
							user_id: updatedProviderRecord.user_id,
							xui: updatedProviderRecord.xui || false,
							version: updatedProviderRecord.version || '',
							revision: updatedProviderRecord.revision || 0,
							timestamp_now: updatedProviderRecord.timestamp_now || 0,
							time_now: updatedProviderRecord.time_now || ''
						};
						await syncCategories(updatedProvider);
						await syncChannels(updatedProvider);
					}
				} catch (checkError) {
					console.error('Error during provider setup:', checkError);
					// We don't want to block the dialog close if the setup fails
				}
			}

			onOpenChange(false);
			// Call onSuccess after the dialog is closed
			setTimeout(onSuccess, 0);
		} catch (err: unknown) {
			console.error('Error saving provider:', err);
			error = err instanceof Error ? err.message : 'Failed to save provider. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>{provider ? 'Edit' : 'Add'} IPTV Provider</DialogTitle>
			<DialogDescription>
				{provider
					? 'Update the provider details below.'
					: 'Fill in the details to add a new provider.'}
			</DialogDescription>
		</DialogHeader>

		<form
			id="providerForm"
			on:submit|preventDefault={handleSubmit}
			autocomplete="off"
			data-lpignore="true"
		>
			<div class="grid gap-4 py-4">
				<div class="space-y-2">
					<label for="name" class="text-sm font-medium">Provider Name</label>
					<Input id="name" bind:value={name} />
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<label for="provider_username" class="text-sm font-medium">Username</label>
						<Input
							id="provider_username"
							type="text"
							name="provider_username"
							autocomplete="off"
							autocorrect="off"
							autocapitalize="off"
							spellcheck="false"
							data-form-type="other"
							data-lpignore="true"
							data-username="false"
							bind:value={username}
							readonly
							on:focus={(e) => {
								const target = e.target as HTMLInputElement;
								if (target) target.removeAttribute('readonly');
							}}
						/>
					</div>

					<div class="space-y-2">
						<label for="provider_password" class="text-sm font-medium">Password</label>
						<Input
							id="provider_password"
							name="provider_password"
							type="text"
							autocomplete="off"
							data-form-type="other"
							data-lpignore="true"
							data-password="false"
							bind:value={password}
							readonly
							on:focus={(e) => {
								const target = e.target as HTMLInputElement;
								if (target) target.removeAttribute('readonly');
							}}
						/>
					</div>
				</div>

				<div class="space-y-2">
					<label for="message" class="text-sm font-medium">Welcome Message</label>
					<Input id="message" bind:value={message} />
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<label for="server_url" class="text-sm font-medium">Server URL</label>
						<Input id="server_url" bind:value={server_url} />
					</div>

					<div class="space-y-2">
						<label for="server_protocol" class="text-sm font-medium">Protocol</label>
						<select
							id="server_protocol"
							bind:value={server_protocol}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
						>
							<option value="http">HTTP</option>
							<option value="https">HTTPS</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-3 gap-4">
					<div class="space-y-2">
						<label for="server_port" class="text-sm font-medium">Server Port</label>
						<Input id="server_port" bind:value={server_port} />
					</div>

					<div class="space-y-2">
						<label for="https_port" class="text-sm font-medium">HTTPS Port</label>
						<Input id="https_port" bind:value={https_port} />
					</div>

					<div class="space-y-2">
						<label for="rtmp_port" class="text-sm font-medium">RTMP Port</label>
						<Input id="rtmp_port" bind:value={rtmp_port} />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<label for="max_connections" class="text-sm font-medium">Max Connections</label>
						<Input id="max_connections" type="number" min="1" bind:value={max_connections} />
					</div>

					<div class="space-y-2">
						<label for="timezone" class="text-sm font-medium">Timezone</label>
						<Input id="timezone" bind:value={timezone} />
					</div>
				</div>
			</div>
		</form>

		{#if error}
			<p class="mb-4 text-sm text-red-500">{error}</p>
		{/if}

		<DialogFooter>
			<Button variant="outline" on:click={() => onOpenChange(false)}>Cancel</Button>
			<Button type="submit" form="providerForm" disabled={loading}>
				{loading ? 'Saving...' : provider ? 'Update' : 'Create'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

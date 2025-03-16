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
	import { createIptvUser, updateIptvUser } from '$lib/pocketbase';
	import type { IPTVUser } from '$lib/types';
	import { addDays } from '$lib/utils';

	export let open = false;
	export let onOpenChange: (open: boolean) => void;
	export let user: Partial<IPTVUser> | null = null;
	export let onSuccess: () => void;

	let loading = false;
	let error = '';

	// Form fields
	let username = user?.username || '';
	let email = user?.email || '';
	let fullName = user?.fullName || '';
	let packageType = user?.packageType || 'Basic';
	let allowedDevices = user?.allowedDevices?.toString() || '1';
	let subscriptionDays = '30'; // Default to 30 days
	let notes = user?.notes || '';

	const packages = ['Basic', 'Standard', 'Premium', 'Ultimate'];

	$: isEditing = !!user;

	async function handleSubmit() {
		loading = true;
		error = '';

		try {
			const userData = {
				username,
				email,
				fullName,
				packageType,
				allowedDevices: parseInt(allowedDevices),
				subscriptionExpiry: addDays(new Date(), parseInt(subscriptionDays)).toISOString(),
				notes,
				active: true
			};

			if (isEditing && user?.id) {
				await updateIptvUser(user.id, userData);
			} else {
				await createIptvUser(userData);
			}

			onSuccess();
			onOpenChange(false);
		} catch (err) {
			console.error('Error saving user:', err);
			error = err.message || 'Failed to save user. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>{isEditing ? 'Edit' : 'Add'} IPTV User</DialogTitle>
			<DialogDescription>
				{isEditing
					? 'Update the user details below.'
					: 'Fill in the details to create a new IPTV user.'}
			</DialogDescription>
		</DialogHeader>

		<div class="grid gap-4 py-4">
			<div class="space-y-2">
				<label for="username" class="text-sm font-medium">Username</label>
				<Input id="username" bind:value={username} />
			</div>

			<div class="space-y-2">
				<label for="email" class="text-sm font-medium">Email</label>
				<Input id="email" type="email" bind:value={email} />
			</div>

			<div class="space-y-2">
				<label for="fullName" class="text-sm font-medium">Full Name</label>
				<Input id="fullName" bind:value={fullName} />
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<label for="packageType" class="text-sm font-medium">Package Type</label>
					<select
						id="packageType"
						bind:value={packageType}
						class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
					>
						{#each packages as pkg}
							<option value={pkg}>{pkg}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<label for="allowedDevices" class="text-sm font-medium">Allowed Devices</label>
					<Input id="allowedDevices" type="number" min="1" max="10" bind:value={allowedDevices} />
				</div>
			</div>

			{#if !isEditing}
				<div class="space-y-2">
					<label for="subscriptionDays" class="text-sm font-medium"
						>Subscription Length (days)</label
					>
					<Input id="subscriptionDays" type="number" min="1" bind:value={subscriptionDays} />
				</div>
			{/if}

			<div class="space-y-2">
				<label for="notes" class="text-sm font-medium">Notes</label>
				<Input id="notes" bind:value={notes} />
			</div>
		</div>

		{#if error}
			<p class="mb-4 text-sm text-red-500">{error}</p>
		{/if}

		<DialogFooter>
			<Button variant="outline" on:click={() => onOpenChange(false)}>Cancel</Button>
			<Button on:click={handleSubmit} disabled={loading}>
				{loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

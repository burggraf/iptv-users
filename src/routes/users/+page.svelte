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
	import IPTVUserDialog from '$lib/components/iptv-user-dialog.svelte';
	import { getIptvUsers, deleteIptvUser } from '$lib/pocketbase';
	import { formatDate, isActive, daysRemaining } from '$lib/utils';
	import type { IPTVUser } from '$lib/types';
	import { onMount } from 'svelte';

	let users: IPTVUser[] = [];
	let loading = true;
	let error = '';
	let searchQuery = '';
	let dialogOpen = false;
	let selectedUser: IPTVUser | null = null;

	async function loadUsers() {
		try {
			const result = await getIptvUsers();
			users = result.items;
			error = '';
		} catch (err) {
			console.error('Error loading users:', err);
			error = 'Failed to load users. Please try again.';
		} finally {
			loading = false;
		}
	}

	onMount(loadUsers);

	function filterUsers() {
		if (!searchQuery) return users;
		const query = searchQuery.toLowerCase();
		return users.filter(
			(user) =>
				user.username.toLowerCase().includes(query) ||
				user.email.toLowerCase().includes(query) ||
				user.fullName?.toLowerCase().includes(query)
		);
	}

	function getUserStatus(expiryDate: string) {
		if (isActive(expiryDate)) {
			const days = daysRemaining(expiryDate);
			return {
				text: `Active (${days} days left)`,
				class: days < 7 ? 'text-yellow-600' : 'text-green-600'
			};
		} else {
			return {
				text: 'Expired',
				class: 'text-red-600'
			};
		}
	}

	async function handleDelete(user: IPTVUser) {
		if (!confirm(`Are you sure you want to delete ${user.username}?`)) {
			return;
		}

		try {
			await deleteIptvUser(user.id);
			await loadUsers();
		} catch (err) {
			console.error('Error deleting user:', err);
			error = 'Failed to delete user. Please try again.';
		}
	}

	function handleEdit(user: IPTVUser) {
		selectedUser = user;
		dialogOpen = true;
	}

	function handleAdd() {
		selectedUser = null;
		dialogOpen = true;
	}
</script>

<div class="container mx-auto py-10">
	<h1 class="mb-6 text-4xl font-bold">IPTV Users Management</h1>

	<div class="mb-6 flex justify-between">
		<div class="w-1/3">
			<Input type="text" placeholder="Search users..." bind:value={searchQuery} />
		</div>
		<Button on:click={handleAdd}>Add New User</Button>
	</div>

	{#if error}
		<Alert variant="destructive" class="mb-4">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if loading}
		<p>Loading users...</p>
	{:else}
		<Card>
			<CardHeader>
				<CardTitle>Users</CardTitle>
				<CardDescription>Manage your IPTV users and subscriptions</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Username</TableHead>
							<TableHead>Full Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Package</TableHead>
							<TableHead>Devices</TableHead>
							<TableHead>Expiry Date</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each filterUsers() as user (user.id)}
							{@const status = getUserStatus(user.subscriptionExpiry)}
							<TableRow>
								<TableCell>{user.username}</TableCell>
								<TableCell>{user.fullName || '-'}</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell class={status.class}>{status.text}</TableCell>
								<TableCell>{user.packageType || 'Basic'}</TableCell>
								<TableCell>{user.allowedDevices || 1}</TableCell>
								<TableCell>{formatDate(user.subscriptionExpiry)}</TableCell>
								<TableCell class="flex gap-2">
									<Button variant="outline" size="sm" on:click={() => handleEdit(user)}>Edit</Button
									>
									<Button
										variant="outline"
										size="sm"
										class="text-red-600"
										on:click={() => handleDelete(user)}>Delete</Button
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

<IPTVUserDialog
	open={dialogOpen}
	onOpenChange={(open) => (dialogOpen = open)}
	user={selectedUser}
	onSuccess={loadUsers}
/>

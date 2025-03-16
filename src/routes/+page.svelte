<script>
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { currentUser } from '$lib/pocketbase';
	import { goto } from '$app/navigation';

	function navigateTo(path) {
		goto(path);
	}
</script>

<div class="container mx-auto py-10">
	<h1 class="mb-6 text-center text-4xl font-bold">IPTV Users Management</h1>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		<Card>
			<CardHeader>
				<CardTitle>User Management</CardTitle>
				<CardDescription>Create, update and delete IPTV users</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Manage your IPTV users, set expiration dates, and track subscription status.</p>
			</CardContent>
			<CardFooter>
				<Button on:click={() => navigateTo('/users')}>Manage Users</Button>
			</CardFooter>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Subscription Analytics</CardTitle>
				<CardDescription>View user subscription analytics</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Track active subscriptions, expired accounts, and user activity.</p>
			</CardContent>
			<CardFooter>
				<Button>View Analytics</Button>
			</CardFooter>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>System Settings</CardTitle>
				<CardDescription>Configure your IPTV management system</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Set up notification preferences, system defaults, and integrations.</p>
			</CardContent>
			<CardFooter>
				<Button>Settings</Button>
			</CardFooter>
		</Card>
	</div>
</div>

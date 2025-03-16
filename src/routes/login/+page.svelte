<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { goto } from '$app/navigation';
	import { login } from '$lib/pocketbase';

	let email = '';
	let password = '';
	let error = '';
	let loading = false;

	const handleLogin = async () => {
		error = '';
		loading = true;

		try {
			if (!email || !password) {
				error = 'Please enter both email and password';
				return;
			}

			await login(email, password);
			goto('/'); // Redirect to home page after successful login
		} catch (err) {
			console.error('Login error:', err);
			error = err.message || 'Failed to login. Please check your credentials.';
		} finally {
			loading = false;
		}
	};
</script>

<div class="container mx-auto flex justify-center py-10">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Login</CardTitle>
			<CardDescription>Enter your credentials to access your account</CardDescription>
		</CardHeader>
		<CardContent>
			{#if error}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			{/if}

			<form id="loginForm" on:submit|preventDefault={handleLogin}>
				<div class="space-y-4">
					<div class="space-y-2">
						<label for="email" class="text-sm font-medium">Email</label>
						<Input
							id="email"
							type="email"
							autocomplete="username"
							placeholder="your@email.com"
							bind:value={email}
						/>
					</div>
					<div class="space-y-2">
						<label for="password" class="text-sm font-medium">Password</label>
						<Input
							id="password"
							type="password"
							autocomplete="current-password"
							placeholder="••••••••"
							bind:value={password}
						/>
					</div>
				</div>
			</form>
		</CardContent>
		<CardFooter class="flex justify-between">
			<Button variant="outline" on:click={() => goto('/register')}>Register</Button>
			<Button type="submit" form="loginForm" disabled={loading}>
				{loading ? 'Logging in...' : 'Login'}
			</Button>
		</CardFooter>
	</Card>
</div>

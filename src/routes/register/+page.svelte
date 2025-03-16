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
	import { register, login } from '$lib/pocketbase';

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let error = '';
	let loading = false;

	const handleRegister = async () => {
		error = '';
		loading = true;

		try {
			// Validate inputs
			if (!name || !email || !password || !confirmPassword) {
				error = 'Please fill out all fields';
				loading = false;
				return;
			}

			if (password !== confirmPassword) {
				error = "Passwords don't match";
				loading = false;
				return;
			}

			// Register the new user
			await register(email, password, confirmPassword, name);

			// Auto login after registration
			await login(email, password);

			// Navigate to home page
			goto('/');
		} catch (err) {
			console.error('Registration error:', err);
			error = err.message || 'Failed to register. Please try again.';
		} finally {
			loading = false;
		}
	};
</script>

<div class="container mx-auto flex justify-center py-10">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Create an Account</CardTitle>
			<CardDescription>Enter your details to create a new account</CardDescription>
		</CardHeader>
		<CardContent>
			{#if error}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			{/if}

			<div class="space-y-4">
				<div class="space-y-2">
					<label for="name" class="text-sm font-medium">Name</label>
					<Input id="name" type="text" placeholder="John Doe" bind:value={name} />
				</div>
				<div class="space-y-2">
					<label for="email" class="text-sm font-medium">Email</label>
					<Input id="email" type="email" placeholder="your@email.com" bind:value={email} />
				</div>
				<div class="space-y-2">
					<label for="password" class="text-sm font-medium">Password</label>
					<Input id="password" type="password" placeholder="••••••••" bind:value={password} />
				</div>
				<div class="space-y-2">
					<label for="confirmPassword" class="text-sm font-medium">Confirm Password</label>
					<Input
						id="confirmPassword"
						type="password"
						placeholder="••••••••"
						bind:value={confirmPassword}
					/>
				</div>
			</div>
		</CardContent>
		<CardFooter class="flex justify-between">
			<Button variant="outline" on:click={() => goto('/login')}>Login Instead</Button>
			<Button on:click={handleRegister} disabled={loading}>
				{loading ? 'Creating Account...' : 'Register'}
			</Button>
		</CardFooter>
	</Card>
</div>

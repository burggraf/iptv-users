<script>
	import '../app.pcss';
	import { Button } from '$lib/components/ui/button';
	import { currentUser, logout } from '$lib/pocketbase';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	function handleLogout() {
		logout();
		goto('/login');
	}
</script>

<div class="flex min-h-screen flex-col bg-background">
	<!-- Navigation Bar -->
	<header class="border-b">
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<div class="flex items-center gap-6">
				<a href="/" class="text-xl font-bold">IPTV Users</a>

				{#if $currentUser}
					<nav class="hidden items-center gap-6 md:flex">
						<a
							href="/"
							class="text-sm font-medium transition-colors hover:text-primary"
							class:text-primary={$page.url.pathname === '/'}
						>
							Dashboard
						</a>
						<a
							href="/users"
							class="text-sm font-medium transition-colors hover:text-primary"
							class:text-primary={$page.url.pathname === '/users'}
						>
							Users
						</a>
					</nav>
				{/if}
			</div>

			<div class="flex items-center gap-4">
				{#if $currentUser}
					<span class="mr-2 text-sm">Hello, {$currentUser.name || $currentUser.email}</span>
					<Button variant="outline" size="sm" on:click={handleLogout}>Logout</Button>
				{:else}
					<Button variant="outline" size="sm" on:click={() => goto('/login')}>Login</Button>
					<Button size="sm" on:click={() => goto('/register')}>Register</Button>
				{/if}
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="container mx-auto flex-1 px-4 py-6">
		<slot />
	</main>

	<!-- Footer -->
	<footer class="border-t py-6">
		<div class="container mx-auto text-center text-sm text-muted-foreground">
			&copy; {new Date().getFullYear()} IPTV Users Management
		</div>
	</footer>
</div>

<!-- filepath: /Users/markb/dev/iptv-users/src/lib/components/ui/dropdown-menu/dropdown-menu-trigger.svelte -->
<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<DropdownMenuPrimitive.Trigger
	class={cn('inline-flex items-center justify-center focus:outline-none', className)}
	{...$$restProps}
>
	<slot />
</DropdownMenuPrimitive.Trigger>

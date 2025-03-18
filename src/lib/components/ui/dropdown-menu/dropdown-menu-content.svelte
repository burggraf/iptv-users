<!-- filepath: /Users/markb/dev/iptv-users/src/lib/components/ui/dropdown-menu/dropdown-menu-content.svelte -->
<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn, flyAndScale } from '$lib/utils';
	import { fade } from 'svelte/transition';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<DropdownMenuPrimitive.Content
	transition={flyAndScale}
	class={cn(
		'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md focus:outline-none',
		className
	)}
	{...$$restProps}
>
	<slot />
</DropdownMenuPrimitive.Content>

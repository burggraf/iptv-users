<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';

	let className: string | undefined = undefined;
	export { className as class };

	export let disabled = false;
	export let onSelect: (() => void) | undefined = undefined;

	const dispatch = createEventDispatcher();

	function handleSelect() {
		if (onSelect) onSelect();
	}
</script>

<DropdownMenuPrimitive.Item
	{disabled}
	class={cn(
		'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		className
	)}
	on:click={handleSelect}
	{...$$restProps}
>
	<slot />
</DropdownMenuPrimitive.Item>

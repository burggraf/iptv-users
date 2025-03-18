<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	type T = $$Generic;
</script>

<DropdownMenuPrimitive.Root {...$$restProps}>
	<slot />
</DropdownMenuPrimitive.Root>

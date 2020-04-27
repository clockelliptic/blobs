<script>
	import Tailwindcss from '../components/Tailwindcss.svelte'
	import Nav from '../components/Nav.svelte';

	export let segment;

</script>

<Tailwindcss />

<div class="absolute inset-0 flex flex-col justify-stretch">
	<Nav {segment}/>
	<main class="w-full h-full relative margin-0 border-box">
		<slot />
	</main>
</div>
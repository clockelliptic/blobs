<svelte:head>
	<title>Sapper project template</title>
</svelte:head>

<style>
	#background {
	position:absolute;
	width:100%;
	height:100%;
	z-index:1;
	}

	#canvas {
	position:absolute;
	width:100%;
	height:100%;
	z-index:2;
	}
</style>

<div id="bounceContainer" class="relative w-full h-full">
	<canvas id="background"></canvas>
	<canvas id="canvas"></canvas>
</div>

<script>
	import { onMount } from 'svelte';
	import Hammer from './bounce/hammer'
	import init from './bounce/initBounce'

	onMount(() => {
		window.requestAnimFrame = (() => 
			window.requestAnimationFrame       || 
			window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame    || 
			window.oRequestAnimationFrame      || 
			window.msRequestAnimationFrame     || 
			function(callback, element){
				window.setTimeout(callback, 1000 / 60);
			}
		)();

		init(Hammer);
	});

	
</script>
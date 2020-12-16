<script>
  import { onMount } from "svelte";

  let PIXI, pixiContainer;

  onMount(async () => {
    PIXI = await import("pixi.js");
    const app = new PIXI.Application();
    pixiContainer.appendChild(app.view);

    // load the texture we need
    app.loader.add("bunny", "bunny.png").load((loader, resources) => {
      // This creates a texture from a 'bunny.png' image
      const bunny = new PIXI.Sprite(resources.bunny.texture);

      // Setup the position of the bunny
      bunny.x = app.renderer.width / 2;
      bunny.y = app.renderer.height / 2;
      // Rotate around the center
      bunny.anchor.x = 0.5;
      bunny.anchor.y = 0.5;

      app.stage.addChild(bunny);

      app.ticker.add(() => {
        bunny.rotation += 0.01;
      });
    });
  });
</script>

<div bind:this={pixiContainer} />
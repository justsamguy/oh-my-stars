## User Input

- The Stars look okay, but right now, the glow doesn't really look like a glow - they look like particles with no core. Make the blur/fade on the outer edge of the glow really strong, so it has a bloom-looking effect. Also, increase the radius by 50%
- The placement of the POIs looks good, just stretch the entire thing vertically so it's 2x the vertical length.
- Based off of how this looks so far, let's move the foreground stars to the background, so that when we scroll, everything barely moves except for our POI setup.
- When a box is open, and another POI box is opening, the first one closes but the second one dissapears halfway through the animation.

## Agent Output

- Enhanced star glow with exponential falloff and 50% larger radius
- Stretched POI positions vertically (2x)
- Moved all star layers to background with minimal parallax (0.02-0.05)
- Fixed info box transitions by ensuring old box removal completes before new box appears
- Updated camera bounds to match new POI layout

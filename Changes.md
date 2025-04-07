## User Input

- Make the distance between POIs more diverse. I want to see at least one given pair relatively close, and one given pair relatively distant. Don't follow a zig-zag pattern - instead, use your understanding of how people perceive random placement to move them to their new locations.
- Make sure the first POI is located in the viewport such that it is 1/3 of the way down from the top of the screen.
- Increase the glow effect of the foreground and background stars to match the glow effect of the POIs; the intensity and radius a function of their size.
- Add foreground stars that are between the size of the background stars and the median size of the existing ones, doubling the number of foreground stars.
- When scrolling, make the movement of foreground stars and background stars so that they still move based on a linear function of their size, but make it subtle. For example, the largest foreground stars should be 1/2 the speed of the POIs at most, smaller stars even less. I don't want a lot of distracting motion, but i want it to look smooth.
- Increase the strength of the smooth scrolling effect by 20%.


## Agent Output

- Repositioned POIs to create more natural clustering and varied distances
- First POI now starts at y=50 (1/3 of viewport height of 150)
- Enhanced star glow with stronger core and wider glow radius
- Added a new intermediate star layer with 800 stars
- Reduced parallax movement speeds for stars (now 5%, 15%, 25%, and 35% of POI speed)
- Increased scroll sensitivity by 20% (0.01 to 0.012)

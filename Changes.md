<!-- User Input -->

Change the foreground stars to be 2x the size, and multiply the particle qty by 3x.
Change the number of POIs from 10 to 7 and re-distribute the colors accordingly. Reposition them, so the distance and direction of each line is unique (so it feels less like a repetitive pattern).
Change the POI glow effect to be smooth on the outer edges. 
Change the glow effect on foreground *and* background stars to 1.7x stronger.
Once opened, the box doesn't open a second time. revert to the previous behavior for now.
Invert the scrolling direction, it's backwards right now.



<!-- Agent Output -->

Triple the number of foreground stars and double their size
Reduce POIs to 7 with unique positioning and redistributed colors
Make POI glow edges smoother using smoothstep
Increase star glow intensity by 1.7x
Allow info boxes to reopen by removing the early return
Invert scroll direction by changing += to -=
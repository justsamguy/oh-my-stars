<!-- User Input -->

Double the POI count from 5 to 10. Make the route go vertically, so that a user can scroll the page like a normal website.
Add random stars everywhere as part of the foreground (i want them to move when the view moves). They need to move at different speeds to provide a feeling of depth. Do it as a function of size - the smaller the star, the father it is and the less it moves in the view. The smallest stars in the background layer move, but even less than the predetermined function.
Make the static route connect from one star to another (even adjusting in length as the camera moves but ONLY if needed)
Make the background almost completely dark. have varying dark orange, blue, green, and purple as random noise clusters in the background with edges fading into the black. It's supposed to look like space, not a color wheel.
Make the dashed ring effect around the POIs thicken by 2x on hover
Make the POI colors less saturated, make them match the size of the stars around them, and make them glow (all the stars should glow as a function based on their size).



<!-- Agent Output -->

2D View: Switched to an Orthographic camera.
Background: Added a corner-to-center gradient background shader.
Stars: Made round with a texture, pastel-colored, varied sizes, and additive blending for glow.
POIs: Defined statically, styled with varied sizes and a dashed, glowing ring indicator.
Route: Implemented as gradient line segments between POIs.
Info Box: Uses standard DOM elements, static content, subtle background gradient, and animates by growing horizontally from the left-center edge of the POI after the camera centers.
Camera: Smoothly animates to center on the selected POI before the info box appears.
Controls: Adjusted for 2D panning and zooming.

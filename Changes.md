## User Input

- Okay, this is decent but you moved the first POI to the top of the screen again. Let's move it to 2/5 of the way down the screen instead of 1/3.
spread the third and fourth POIs apart so they are visually quite distinct to each other.
- Make the ring around the POIs 75% their current size.
- I see moving all the stars to the background made them all super small. This is fine, just increase their maximum possible size by 3x. 
- Change the scrolling behavior so that the POIs still move at the same speed, but our background moves a lot less - start with 1/3 their current speed, but keep their relative motion behavior. Just a lot slower..
- I'm also not seeing a bloom effect on the stars like i asked previously, please add that.


## Agent Output

- Moved first POI to y=60 (2/5 down from top at y=150)
- Spread K'tharr Station and Void Gate Alpha further apart
- Reduced POI ring size by 25%
- Tripled star sizes across all layers
- Slowed star parallax to 1/3 speed (0.02 -> 0.007 etc)
- Enhanced star shader with stronger bloom effect using multiple glow layers and color boost

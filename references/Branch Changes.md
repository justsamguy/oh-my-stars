Original Prompt:

I have an interactive 3D star map application built with Three.js. It uses a WebGLRenderer for the main scene (stars, points of interest) and a CSS3DRenderer for HTML-based overlays like a header, footer, and dynamic info boxes. The application already handles resizing of the Three.js camera and both renderers correctly when the browser window (and thus the main canvas) is resized. The `onWindowResize` function in `main.js` updates camera projection and renderer sizes based on the canvas's `clientWidth` and `clientHeight`. However, the HTML content within the CSS3DObjects (header, footer) and the info boxes are not fully responsive due to fixed pixel dimensions and font sizes set via inline JavaScript styles and some CSS rules. I need to make the following elements fully responsive: 1. **Header and Footer (CSS3DObjects):** * These are created by `createHeaderElement()` and `createFooterElement()` in `layoutConfig.js`. * **Task:** Modify these functions to: * Remove inline `style.width` that sets fixed pixel widths. * Change inline `style.fontSize` from fixed pixel values to use responsive units (e.g., `em`, `vw`), or remove them to allow `style.css` to control font sizes. * **Task:** Modify `style.css` for the `.css3d-header`, `.css3d-footer`, and their child elements: * Remove any fixed `width` properties. * Implement responsive widths (e.g., using percentages like `width: 90%;`, `max-width`, and `margin: 0 auto;` for centering). * Ensure font sizes, paddings, and margins within the header and footer scale appropriately using responsive units (`em`, `rem`, `vw`, `%`) or media queries. 2. **Info Box (Dynamically created HTML in `interaction.js`):** * The `openInfoBox` function in `interaction.js` creates and positions an info box. * **Task:** Modify `openInfoBox`: * Change the calculation of `screenX` and `screenY` to use the dimensions of the Three.js canvas (`renderer.domElement.getBoundingClientRect()` or `document.getElementById('bg').getBoundingClientRect()`) instead of `window.innerWidth` and `window.innerHeight`. This is to ensure correct positioning relative to the canvas. (A similar calculation is already done correctly in `main.js`'s `animate` loop for `currentInfoBox.style.left` and `top`). * **Optional but recommended:** The current info box uses fixed pixel values for `minBoxWidth`, `maxBoxWidth`, and internal font sizes/paddings. Suggest ways to make these more responsive, either by scaling them based on canvas width or by applying CSS classes and using media queries/viewport units in `style.css`.

Refined Prompt:
I have an interactive 3D star map application built with Three.js. It uses a WebGLRenderer for the main scene and a CSS3DRenderer for HTML-based overlays (header, footer, info boxes).

__Primary Task: Fix Dynamic Canvas Resizing__

The main Three.js canvas (`<canvas id="bg">`) and its associated WebGL renderer (`renderer`) and CSS3D renderer (`cssRenderer`) do not currently resize dynamically when the browser window is resized. A page refresh is required for the application to adapt to new window dimensions. The application looks correct *after* a refresh at various sizes, suggesting the core logic in `onWindowResize` in `main.js` for updating camera and renderer sizes is fundamentally sound but isn't effective in real-time.

- __Goal:__ Ensure the main canvas, WebGL renderer, and CSS3D renderer dynamically resize and update correctly *as the browser window is resized*, without requiring a page refresh.

- __Actions:__

  1. Investigate `main.js` and related files (`interaction.js` for `setupResizeHandler`, `style.css` for `#bg` and `#app-container` styling) to determine why the existing `onWindowResize` function isn't achieving real-time dynamic resizing.
  2. Ensure that when `onWindowResize` is triggered during a window resize event, it correctly obtains the *new* dimensions of the canvas (e.g., `canvas.clientWidth`, `canvas.clientHeight`).
  3. Verify that the calls to `renderer.setSize()`, `cssRenderer.setSize()`, and `camera.updateProjectionMatrix()` within `onWindowResize` use these updated dimensions and that these changes are rendered immediately by Three.js.

__Secondary Tasks: Improve HTML Overlay Content Responsiveness (Favoring CSS)__

Once the canvas itself resizes dynamically, improve the responsiveness of the HTML content within the CSS3DObjects (header, footer) and the dynamically created info boxes. The general approach should be to remove fixed pixel dimensions and font sizes from JavaScript inline styles and manage them using responsive units and techniques in `style.css`.

1. __Header and Footer Content (CSS3DObjects):__

   - These are created by `createHeaderElement()` and `createFooterElement()` in `layoutConfig.js`.

   - __Task (layoutConfig.js):__

     - Remove inline `style.width` that sets fixed pixel widths.
     - Remove or change inline `style.fontSize` from fixed pixel values to allow `style.css` to control font sizes effectively with responsive units.

   - __Task (style.css):__

     - Modify CSS rules for `.css3d-header`, `.css3d-footer`, and their child elements.
     - Remove any fixed `width` properties.
     - Implement responsive widths (e.g., using percentages like `width: 90%;`, `max-width`, and `margin: 0 auto;` for centering).
     - Ensure font sizes, paddings, and margins scale appropriately using responsive units (`em`, `rem`, `vw`, `%`) and/or media queries.

2. __Info Box Positioning (Dynamically created HTML in `interaction.js`):__

   - The `openInfoBox` function in `interaction.js` creates and positions an info box.
   - __Task (interaction.js - Positioning):__
     - Modify the calculation of initial `screenX` and `screenY` in `openInfoBox` to use the dimensions of the Three.js canvas (e.g., via `renderer.domElement.getBoundingClientRect()`) instead of `window.innerWidth` and `window.innerHeight`. The existing logic in `main.js`'s `animate` loop for updating `currentInfoBox.style.left` and `top` (which correctly uses canvas dimensions) should serve as a direct reference.

3. __Info Box Internal Content (Dynamically created HTML in `interaction.js`):__

   - __Task (interaction.js - Styling Cleanup):__
     - In `openInfoBox`, remove inline JavaScript styles that set fixed pixel values for `minBoxWidth`, `maxBoxWidth`, internal font sizes (e.g., on the title `<h3>` or paragraph `<p>`), and paddings.

   - __Task (style.css - Styling Implementation):__

     - Add new CSS rules for the info box elements (e.g., targeting the existing `.info-box` class, or a new, more specific class like `.dynamic-info-box` if preferred, which should be assigned to the main info box `div` in `openInfoBox`).
     - Use these CSS rules to control `min-width`, `max-width`, `padding`, `font-size`, and other relevant properties using responsive units (`em`, `rem`, `vw`, `%`) and media queries to ensure the info box content scales appropriately. For `width` or `min-width`, prefer CSS-based responsive values (e.g., `width: 80vw; max-width: 350px;`) over trying to replicate the exact JS-based title-fitting width, to simplify responsiveness.

__File Context:__ The relevant files are primarily `main.js`, `interaction.js`, `layoutConfig.js`, and `style.css`. The canvas element has the ID `bg`.

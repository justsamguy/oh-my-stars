### General practices
* Use **ES Modules** (`import …`) – never `require`.
* Prefer **async/await**; avoid `.then` chains.
* Refer to the project's main README.md for overall project context.

### Formatting
* 2-space indentation, semicolons **on**, single quotes.
* When using terminal commands, format them for use in powershell.
* When using tools to run commands or make edits, consolidate their uses as much as possible.
* When analyzing and coming to a conclusion, include 1 or 2 sentences that explain the actions being taken.
* When something is done, decide if it is a significant enough action to request an image be shared back for further analysis.

### Security
* All SQL must be parameterised (use `pg` tagged templates).
* Never log JWTs or secrets.

### Testing
* When installing dependencies, ensure they are not installed within the application directory.


### Communication preferences
* Assume that my messages are based entirely on the context of the conversation and interpret them accordingly.
* Reply in **concise English**, include annotations.
* Add a one-line summary of the actions taken in addition to each response for saving changes. Examples: "Changed the style of the button in the header to be more prominent"; "Fixed header to fit on screen". Separate multiple actions with a semicolon. If you opt to make a list of changes, include the one-line summary after the list.


---
_Rules below are auto-copied from your existing Cline rules file (if present)._
---
description: Guidelines for creating and maintaining Cline rules to ensure consistency.
globs: .clinerules/**/*.txt
alwaysApply: true
---

- **Required Rule Structure:**
  ```markdown
  ---
  description: Clear, one-line description of what the rule enforces
  globs: path/to/files/*.ext, other/path/**/*
  alwaysApply: boolean
  ---

  - **Main Points in Bold**
    - Sub-points with details
    - Examples and explanations
  ```

- **File References:**
  - Use `[filename](mdc:path/to/file)` ([filename](mdc:filename)) to reference files
  - Example: [prisma.mdc](mdc:.clinerules/prisma.mdc) for rule references
  - Example: [schema.prisma](mdc:prisma/schema.prisma) for code references

- **Code Examples:**
  - Use language-specific code blocks
  ```typescript
  // ✅ DO: Show good examples
  const goodExample = true;

  // ❌ DON'T: Show anti-patterns
  const badExample = false;
  ```

- **Rule Content Guidelines:**
  - Start with high-level overview
  - Include specific, actionable requirements
  - Show examples of correct implementation
  - Reference existing code when possible
  - Keep rules DRY by referencing other rules

- **Tailoring Rules for Web Rendering Applications:**
  - **JavaScript Module Best Practices:**
    - Write rules that encourage clear `export` and `import` statements.
    - Emphasize single responsibility for modules (e.g., `interaction.js` handles interactions, `poi.js` handles POIs).
    - Suggest consistent naming conventions for exported functions and variables.
    - Example Rule Idea: "Modules should export related functionality."
  - **Web Interaction Patterns:**
    - Create rules for consistent handling of mouse, touch, scroll, and resize events.
    - Include guidelines for managing event listeners (adding and removing them to prevent memory leaks).
    - Provide examples for rules related to DOM manipulation based on user interaction.
    - Example Rule Idea: "All event listeners should be properly removed when no longer needed."
  - **Code Structure for Rendering Applications:**
    - Develop rules that guide the organization of code related to the rendering library (e.g., Three.js).
    - Include guidelines for managing the scene, camera, renderer, and 3D objects.
    - Suggest rules for structuring the animation loop and update functions.
    - Example Rule Idea: "Rendering setup and animation logic should be separated."

- **Rule Maintenance:**
  - Update rules when new patterns emerge
  - Add examples from actual codebase
  - Remove outdated patterns
  - Cross-reference related rules

- **Best Practices:**
  - Use bullet points for clarity
  - Keep descriptions concise
  - Include both DO and DON'T examples
  - Reference actual code over theoretical examples
  - Use consistent formatting across rules
  - Remember that modifying code may impact other parts of the application, so ensure changes don't introduce new issues.

---
## Implementation Instructions

1. Place this file at the indicated path inside `.clinerules/meta/`.
2. Run **“Cline: Reload Rules”** in VS Code or restart the Cline LSP/CLI so it picks up changes.
3. Edit the `globs` pattern above if your project structure differs.
4. Keep this guideline file under version control so the team shares the same conventions.
---
description: Guidelines for continuously evolving Cline rules as new patterns emerge.
globs: .clinerules/**/*.txt
alwaysApply: true
---

- **Rule Improvement Triggers:**
  - New code patterns not covered by existing rules
  - Repeated similar implementations across files
  - Common error patterns that could be prevented
  - New libraries or tools being used consistently
  - Emerging best practices in the codebase

- **Analysis Process:**
  - Compare new code with existing rules
  - Identify patterns that should be standardized
  - Look for references to external documentation
  - Check for consistent error handling patterns
  - Monitor test patterns and coverage

- **Rule Updates:**
  - **Add New Rules When:**
    - A new technology/pattern is used in 3+ files
    - Common bugs could be prevented by a rule
    - Code reviews repeatedly mention the same feedback
    - New security or performance patterns emerge

  - **Modify Existing Rules When:**
    - Better examples exist in the codebase
    - Additional edge cases are discovered
    - Related rules have been updated
    - Implementation details have changed

- **Example Pattern Recognition:**
  ```javascript
  // If you see repeated patterns like:
  const button = document.getElementById('myButton');
  button.addEventListener('click', handleClick);

  // Consider adding a rule to ensure:
  // - Event listeners are added consistently.
  // - Corresponding removeEventListener calls exist when needed (e.g., in cleanup functions).
  // - Appropriate event delegation is used for performance.
  ```

- **Rule Quality Checks:**
  - Rules should be actionable and specific
  - Examples should come from actual code
  - References should be up to date
  - Patterns should be consistently enforced

- **Continuous Improvement:**
  - Monitor code review comments
  - Track common development questions
  - Update rules after major refactors
  - Add links to relevant documentation
  - Cross-reference related rules

- **Rule Deprecation:**
  - Mark outdated patterns as deprecated
  - Remove rules that no longer apply
  - Update references to deprecated rules
  - Document migration paths for old patterns

- **Documentation Updates:**
  - Keep examples synchronized with code
  - Update references to external docs
  - Maintain links between related rules
  - Document breaking changes

---
## Implementation Instructions

1. Place this file at the indicated path inside `.clinerules/meta/`.
2. Run **“Cline: Reload Rules”** in VS Code or restart the Cline LSP/CLI so it picks up changes.
3. Edit the `globs` pattern above if your project structure differs.
4. Keep this guideline file under version control so the team shares the same conventions.
---
description: Workflow guide for developing the Star Map application.
globs: *.html, *.css, *.js
alwaysApply: true
---

- **Development Workflow Process**
  - Edit project files: `index.html`, `style.css`, `main.js`, `config.js`, `interaction.js`, `layoutConfig.js`, `poi.js`, `sceneSetup.js`, `stars.js`, `utils.js`.
  - Open `index.html` in a web browser to view changes and test functionality.
  - Use browser developer tools (console, elements, network) for debugging and inspection.
  - Utilize Git for version control (committing changes, creating branches, pushing to remote).

- **Project Structure**
  - `index.html`: Main HTML file.
  - `style.css`: Stylesheet for the application.
  - `main.js`: Entry point and core logic.
  - `config.js`: Configuration settings.
  - `interaction.js`: Handles user interactions.
  - `layoutConfig.js`: Configuration for layout.
  - `poi.js`: Logic for Points of Interest.
  - `sceneSetup.js`: Sets up the 3D scene (if applicable).
  - `stars.js`: Logic related to stars.
  - `utils.js`: Utility functions.
  - `references/`: Directory for reference materials.

- **Viewing Changes**
  - After saving changes to HTML, CSS, or JavaScript files, refresh the browser page displaying `index.html`.

- **Debugging**
  - Use `console.log()` statements in JavaScript for outputting information.
  - Set breakpoints in the browser's developer tools to step through JavaScript code execution.
  - Inspect elements and styles using the browser's developer tools.

---
## Implementation Instructions

1. Place this file at the indicated path inside `.clinerules/workflow/`.
2. Run **“Cline: Reload Rules”** in VS Code or restart the Cline LSP/CLI so it picks up changes.
3. Edit the `globs` pattern above if your project structure differs significantly (though the current pattern `*.html, *.css, *.js` should cover most relevant files).
4. Keep this guideline file under version control so the team shares the same conventions.

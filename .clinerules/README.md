# Cline Rule Categories

Refer to the project's main README.md for overall project context.

This folder tree is ready to drop into your project’s root so Cline can load the rules automatically:

```
.clinerules/
  meta/
    rule-authoring.mdc
    rule-evolution.mdc
  workflow/
    task-master-workflow.mdc
```

- **meta/** – rules about writing & improving other Cline rules; applies to every `.mdc` inside `.clinerules`.
- **workflow/** – development‑process rules tied to the Task Master CLI (`scripts/dev.js`, `tasks/**/*.json`).

After copying, run **“Cline: Reload Rules”** in VS Code (or restart Cline in your CLI/CI) to activate them.

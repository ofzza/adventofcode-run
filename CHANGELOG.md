### Version 1.0.5

- Added support for `--obfuscate` argument
- Added support for passing conditional command arguments: `{{verbose??--verbose}}`
- Clearing coloring from task output before validating as result

### Version 1.0.4

Added support for direct CLI execution when installed globally

### Version 1.0.0

Initial implementation with full basic capabilities:

- `adventofcode --help`
- `adventofcode init` command for creating a default config file
- `adventofcode list` command for listing runnable, configured tasks
- `adventofcode run` command for running configured tasks by criteria: all, explicit ordinals, starts-with name, type

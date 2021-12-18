### Version 1.1.2

- Adding support for multiple runs of the same task
- During multiple runs of a task, dynamic arguments can reference properties defined in the current run configuration
- Updated README.md

### Version 1.0.10

- Making timing more precise by not counting process spawning time

### Version 1.0.7

- Additional console output formatting tweaks

### Version 1.0.6

- Task stdout to console formatting tweaks

### Version 1.0.5

- Added support for `--obfuscate` argument
- Added support for passing conditional command arguments: `{{verbose??--verbose}}`
- Clearing coloring from task output before validating as result
- Enabled streaming of execution output from stdout

### Version 1.0.4

Added support for direct CLI execution when installed globally

### Version 1.0.0

Initial implementation with full basic capabilities:

- `adventofcode --help`
- `adventofcode init` command for creating a default config file
- `adventofcode list` command for listing runnable, configured tasks
- `adventofcode run` command for running configured tasks by criteria: all, explicit ordinals, starts-with name, type

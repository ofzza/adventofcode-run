# adventofcode

Task runner for AdventOfCode.com solutions

## Installation

To use with ease, install as a global NPM module:

```sh
$ npm install -g @ofzza/adventofcode
```

Then check out help for usage info, or read on:

```sh
$ adventofcode --help
```

## Usage

Advent of Code runner executes and times your Advent of Code solutions.

### Config

To use the runner, just create a config JSON file (comments allowed) by running the following:

```sh
$ adventofcode init
```

The created configuration file `./aoc.json` will have the following schema:

```js
{
  // General information
  "author": "ofzza",
  "year": 2021,

  // Runnable tasks
  "tasks": [
    // First test task
    {
      // Optional task name. Used as a task descriptor and can be used to select which task(s) to run.
      "name": "test-01",
      // Optional task type. Use any value here, it is used to select which task(s) to run.
      "type": "test",
      // Command to execute to run the task. All paths are relative to the parent directory of the configuration file.
      "command": "bash",
      // Optional command arguments to execute the command with. All paths are relative to the parent directory of the configuration file.
      "args": ["./task1.sh"],
      // Optional value expected as task result. If provided will count task as valid/invalid.
      "value": "Hello world"
    },

    // Second test task
    {
      "name": "test-02",
      "type": "test",
      "command": "bash",
      "args": ["./task2.sh"],
      "value": "123"
    },

    // Third test task
    {
      "name": "solution-A",
      "type": "solution",
      "command": "bash",
      // Startup arguments can be used to modify arguments sent to a task command
      "args": ["./task3.sh", "{{verbose??--verbose}}", "{{obfuscate??--obfuscate}}"],
      "value": "456"
    }

    // ...
  ]
}
```

> The `value` optional property of the task definition, will be compared to the last line output by the process being run out to `stdout`. Your program can output debug information, but only the last line will count as the final result.

### CLI

| Description                   | Syntax                                   | Output                                        | Explanation |
| ----------------------------- | ---------------------------------------- | --------------------------------------------- | ----------- |
| List tasks                    | `$ adventofcode list`                    | `bash ./task1.sh`                             | Command(s)  |
|                               |                                          | `bash ./task2.sh`                             |             |
|                               |                                          | `bash ./task3.sh`                             |             |
|                               |                                          |                                               |             |
| List tasks from custom config | `$ adventofcode list -c ./dir/conf.json` | `bash ./task1.sh`                             | Command(s)  |
|                               |                                          | `bash ./task2.sh`                             |             |
|                               |                                          | `bash ./task3.sh`                             |             |
|                               |                                          |                                               |             |
| List tasks verbosely          | `$ adventofcode list -v`                 | `> Found 3 runnable tasks:`                   | Full info   |
|                               |                                          | `001. test-01, test (bash ./task1.sh)`        |             |
|                               |                                          | `002. test-02, test (bash ./task2.sh)`        |             |
|                               |                                          | `003. solution-A, solution (bash ./task3.sh)` |             |

> If custom `--config` is not specified, `./aoc.json` is presumed.

| Description                     | Syntax                                  | Output                           | Explanation                                |
| ------------------------------- | --------------------------------------- | -------------------------------- | ------------------------------------------ |
| Run all tasks                   | `$ adventofcode run`                    | ✘ 141ms 123                      | Outputs success, execution time and result |
|                                 |                                         | ✓ 142ms 123                      |                                            |
|                                 |                                         | ✘ 136ms 123                      |                                            |
|                                 |                                         |                                  |                                            |
| Run cherry picked task(s)       | `$ adventofcode run -t 1 -t 3`          | ✘ 141ms 123                      | Only runs 1st and 3rd tasks                |
|                                 |                                         | ✘ 136ms 123                      |                                            |
|                                 |                                         |                                  |                                            |
| Ran tasks by name               | `$ adventofcode run -n test`            | ✘ 141ms 123                      | Runs tasks with names starting with "test" |
|                                 |                                         | ✓ 142ms 123                      |                                            |
|                                 |                                         |                                  |                                            |
| Run tasks by type               | `$ adventofcode run -p solution`        | ✘ 136ms 123                      | Runs tasks with type "solution"            |
|                                 |                                         |                                  |                                            |
| Runs tasks from custom config   | `$ adventofcode run -c ./dir/conf.json` | ✘ 141ms 123                      | Runs from custom config                    |
|                                 |                                         | ✓ 142ms 123                      |                                            |
|                                 |                                         | ✘ 136ms 123                      |                                            |
|                                 |                                         |                                  |                                            |
| Runs tasks verbosely            | `$ adventofcode run -v`                 | [Verbose output with summary]    | Runs with verbose output                   |
|                                 |                                         |                                  |                                            |
| Runs tasks and obfuscate result | `$ adventofcode run -b`                 | [Obfuscated output with summary] | Runs with obfuscated output                |
|                                 |                                         |                                  |                                            |
| Run tasks with fully piped      | `$ adventofcode run -v -o`              | [Verbose output with summary]    | Runs with full stdout piped to output      |
| stdout output                   |                                         | [and full stdout piped through]  |                                            |

> If custom `--config` is not specified, `./aoc.json` is presumed.

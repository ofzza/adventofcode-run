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
    // Test task
    {
      "name": "test-01",
      "type": "test",
      "command": "bash",
      "args": ["./task1.sh"]
    },

    // Test task with expected value
    {
      "name": "test-02",
      "type": "test",
      "command": "bash",
      "args": ["./task2.sh"],
      "value": "Hello world"
    },

    // Solution test task with dynamic arguments
    {
      "name": "solution-A",
      "type": "solution",
      "command": "bash",
      "args": ["./task3.sh", "--name", "{{:name}}", "{{verbose??--verbose}}", "{{obfuscate??--obfuscate}}"],
      "value": "Hello world"
    }

    // Solution task with multiple inputs and expected values
    {
      "name": "solution-B",
      "type": "solution",
      "command": "bash",
      "args": ["{{input??:input}}", "--name", "{{:name}}", "{{arg??--some-argument :arg}}"],
      "runs": [
        { "name": "solution-B1", "input": "./multi-task.sh", "arg": "1", "value": "Hello world" },
        { "name": "solution-B2", "input": "./multi-task.sh", "arg": "2", "value": "Hello world" },
        { "name": "solution-B3", "input": "./multi-task.sh", "arg": "3" },
        { "name": "solution-B4", "input": "./multi-task.sh", "arg": "4" }
      ]
    }

    // ...
  ]
}
```

#### Configuration properties for each task:

- ##### (Optional) `name`

  Task name. Used as a task descriptor and can be used to select which task(s) to run.

- ##### (Optional) `type`

  Task type. Use any value here, it is used to select which task(s) to run.

- ##### `command`

  Command to execute to run the task. All paths are relative to the parent directory of the configuration file.

- ##### (Optional) `args`

  Command arguments to execute the command with. Arguments can use dynamic argument syntax as described below.

  _Dynamic arguments_:

  Startup arguments, and any property of a configuration can be used to modify arguments sent to a task command as dynamic arguments:

  - Dynamic argument expressions should be placed inside double brackets and are made of a condition and a syntax part (`{{condition??syntax}}`), separated with a `??`, or just the syntax part (`{{syntax}}`).

  - the (optional) condition part specifies a name of the startup argument or configuration property whose existence is used as a condition for the argument being used at all.

  - the syntax part will be used verbatim with the exception of `:variables` which will be replaced with values of startup arguments or configuration properties of the same name as the variable.

  EXAMPLES, following startup arguments execute different dynamic tasks:

  | Startup arguments                                        | Task(s) executed                                           | Expected value |
  | -------------------------------------------------------- | ---------------------------------------------------------- | -------------- |
  | `$ adventofcode run -n solution-A`                       | `$ task3.sh --name "solution-A"`                           | `Hello world`  |
  |                                                          |                                                            |                |
  | `$ adventofcode run -n solution-A --verbose`             | `$ task3.sh --name "solution-A" --verbose`                 | `Hello world`  |
  |                                                          |                                                            |                |
  | `$ adventofcode run -n solution-A --obfuscate`           | `$ task3.sh --name "solution-A" --obfuscate`               | `Hello world`  |
  |                                                          |                                                            |                |
  | `$ adventofcode run -n solution-B --verbose --obfuscate` | `$ multi-task.sh --name "solution-B1" --some-argument "1"` | `Hello world`  |
  |                                                          | `$ multi-task.sh --name "solution-B2" --some-argument "2"` | `Hello world`  |
  |                                                          | `$ multi-task.sh --name "solution-B3" --some-argument "3"` |                |
  |                                                          | `$ multi-task.sh --name "solution-B4" --some-argument "4"` |                |

- ##### (Optional) `value`

The `value` optional property of the task definition, will be compared to the last line output by the process being run out to `stdout` to determine the task value as valid or invalid. Your program can output debug information, but only the last line will count as its final result.

- ##### (Optional) `runs`

Definition for multiple runs of the task - on each run, this configuration will be overridden with properties from the run and additional properties can be added

>

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

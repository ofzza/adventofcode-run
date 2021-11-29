// Dependencies
import 'colors';
import yargs from 'yargs/yargs';
import { Configuration, TTaskConfiguration, Task, TaskResult } from './services';

// Parse arguments
yargs(process.argv.slice(2))
  // Define common CLI options
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    describe: 'Verbose output',
    default: false,
  })
  .option('config', {
    alias: 'c',
    type: 'string',
    describe: 'Path to the configuration file',
    default: './aoc.json',
  })
  .option('task', {
    alias: 't',
    type: 'number',
    describe: 'Number of task(s) to run',
    default: [],
  })
  .option('task', {
    alias: 't',
    type: 'number',
    describe: 'Number of task(s) to run',
    default: [],
  })
  .option('name', {
    alias: 'n',
    type: 'string',
    describe: 'Start of name of task(s) to run',
    default: '',
  })
  .option('type', {
    alias: 'p',
    type: 'string',
    describe: 'Type of task(s) to run',
    default: '',
  })
  // Define CLI commands
  .command(
    'init',
    'Creates a default configuration file int he current directory',
    () => undefined,
    async (argv: Record<string, string | string[]>) => {
      // Write default config file
      configWriteDefault(argv);
    },
  )
  .command(
    'list',
    'List all runnable tasks',
    () => undefined,
    async (argv: Record<string, string | string[]>) => {
      // Load and output configuration
      configInit(argv);
      printConfigHeader(argv);
      // List tasks
      printTaskList(argv);
    },
  )
  .command(
    'run',
    'Run all runnable tasks',
    // Additional command options
    yargs =>
      yargs
        .option('output', {
          alias: 'o',
          type: 'boolean',
          describe: 'Pipes everything from the task being run',
          default: false,
        })
        .option('obfuscate', {
          alias: 'b',
          type: 'boolean',
          describe: 'Obfuscate result',
          default: false,
        }),
    async (argv: Record<string, string | string[]>) => {
      // Load and output configuration
      configInit(argv);
      printConfigHeader(argv);
      // Run tasks
      runTasks(argv);
    },
  )
  .help().argv;

/**
 * Initialize configuration writing a default config file
 * @param argv CLI arguments
 */
function configWriteDefault(argv: Record<string, string | string[]>) {
  try {
    Configuration.writeDefault(argv.config as string);
  } catch (err) {
    console.error(`ERROR: Failed initializing configuration with error message: ${err.message}`.red);
    process.exit(1);
  }
}

/**
 * Initialize configuration from a config file
 * @param argv CLI arguments
 */
function configInit(argv: Record<string, string | string[]>) {
  try {
    Configuration.initialize(argv.config as string);
  } catch (err) {
    console.error(`ERROR: Failed initializing configuration with error message: ${err.message}`.red);
    process.exit(1);
  }
}

/**
 * Print configuration header
 * @param argv CLI arguments
 */
function printConfigHeader(argv: Record<string, string | string[]>) {
  if (!!argv.verbose) {
    console.log();
    console.log(`| Advent of Code ${Configuration.config.year}, ${Configuration.config.author}`.white);
    console.log([`|`.white, ` CWD: ${Configuration.cwd}`.gray].join(''));
    console.log(`--------------------------------------------------------------`.white);
    console.log();
  }
}

/**
 * Print list of runnable tasks
 * @param verbose If verbose output is requested
 */
function printTaskList(argv: Record<string, string | string[]>) {
  // Get tasks
  const tasks = Task.get({
    tasks: argv.task instanceof Array ? argv.task.map(task => parseInt(task)) : argv.task ? [parseInt(argv.task)] : [],
    type: argv.type as string,
    name: argv.name as string,
  });
  // Verbose output
  if (!!argv.verbose) {
    console.log(`> Found ${tasks.length} runnable tasks${tasks.length ? ':' : '!'}`.gray);
    for (const i of Object.keys(tasks).map(i => parseInt(i))) {
      console.log(taskToString(i + 1, tasks[i]));
    }
  }
  // Non verbose output
  else {
    for (const task of tasks) {
      console.log(`${task.command} ${task.args?.join(' ')}`);
    }
  }
}

/**
 * Executes requested task
 * @param argv Startup arguments
 */
async function runTasks(argv: Record<string, string | string[]>) {
  // Initialize task runner
  const runner = Task.run(argv, text => {
    if (argv.output) {
      const obfuscatedOutput = text;
      console.log([...obfuscatedOutput.trim().split('\n')].join('\n').dim.italic);
    }
  });

  // Run tasks and output result
  const results: TaskResult[] = [];
  while (true) {
    // Get task being run
    const stepA = await runner.next();
    if (stepA.done) break;
    const task = stepA.value;

    // Output task info
    if (!!argv.verbose) {
      console.log(taskToString(results.length, task));
    }

    // Run task
    if (argv.output) {
      console.log('~~~ task output ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'.blue);
    }
    const stepB = await runner.next();
    if (argv.output) {
      console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'.blue);
    }
    if (stepB.done) break;
    const result = stepB.value;

    // Store result
    results.push(result);

    // Verbose output of result
    if (!!argv.verbose) {
      console.log(resultToString(result, !!argv.output, !!argv.obfuscate));
      console.log();
    }
    // Non verbose output of result
    else {
      // Task execution output
      console.log(
        `${result.isValid === undefined ? '?' : result.isValid ? '✓'.green : '✘'.red} ${result.time}ms ${
          result.value instanceof Error ? result.value.message.replace(/\n/g, ' \\n ') : !argv.obfuscate ? result.value : '*****'
        }`,
      );
    }
  }

  // Compile execution stats
  const stats = {
    error: results.filter(r => r.isError).map(r => r.time),
    invalid: results.filter(r => !r.isError && r.isValid === false).map(r => r.time),
    valid: results.filter(r => !r.isError && r.isValid === true).map(r => r.time),
    unknown: results.filter(r => !r.isError && r.isValid === undefined).map(r => r.time),
  };
  const times = {
    error: stats.error.reduce((s, t) => s + t, 0),
    invalid: stats.invalid.reduce((s, t) => s + t, 0),
    valid: stats.valid.reduce((s, t) => s + t, 0),
    unknown: stats.unknown.reduce((s, t) => s + t, 0),
  };
  // Output stats
  if (!!argv.verbose) {
    console.log(`--------------------------------------------------------------`.gray);
    console.log();
    console.log(
      [
        `Executed `.gray,
        `${stats.error.length + stats.invalid.length + stats.valid.length + stats.unknown.length}`,
        ` tasks in `.gray,
        `${times.error + times.invalid + times.valid + times.unknown} ms`,
        `:`.gray,
      ].join(''),
    );
    if (stats.error.length) {
      console.log(['- '.gray, '✘ Error   '.red, `| Executed `.gray, `${stats.error.length}`, ` tasks in `.gray, `${times.error} ms`].join(''));
    }
    if (stats.invalid.length) {
      console.log(['- '.gray, '✘ Invalid '.red, `| Executed `.gray, `${stats.invalid.length}`, ` tasks in `.gray, `${times.invalid} ms`].join(''));
    }
    if (stats.valid.length) {
      console.log(['- '.gray, '✓ Valid   '.green, `| Executed `.gray, `${stats.valid.length}`, ` tasks in `.gray, `${times.valid} ms`].join(''));
    }
    if (stats.unknown.length) {
      console.log(['- '.gray, '? Unknown ', `| Executed `.gray, `${stats.unknown.length}`, ` tasks in `.gray, `${times.unknown} ms`].join(''));
    }
  }
}

/**
 * Composes a string representation of a task
 * @param i Index of the task
 * @param task Task instance
 * @returns String representation of a task
 */
function taskToString(i, task: TTaskConfiguration) {
  return [
    `${i.toString().padStart(3, '0')}. ${task.name}, `.gray,
    `${task.type} `.gray,
    `(`.gray,
    `${task.command} ${task.args?.join(' ')}`.white,
    `)`.gray,
  ].join('');
}

/**
 * Composes a string representation of a task execution result
 * @param result Result instance
 * @param output If full output should be displayed
 * @param obfuscate If result output should be obfuscated
 * @returns String representation of a task execution result
 */
function resultToString(result: TaskResult, output = false, obfuscate = false) {
  const obfuscatedOutput = !obfuscate ? result.output : result.output.replace(new RegExp(result.value.toString(), 'g'), '*****');
  return [
    // Task execution result
    '- executed in:   '.gray,
    `${result.time} ms `.white,
    '\n',
    '- result:        '.gray,
    result.isError
      ? `${(result.value as Error).message.replace(/\n/g, ' \\n ')}`.red
      : [
          `${!obfuscate ? result.value : '*****'}`[result.isValid === undefined ? 'white' : result.isValid ? 'green' : 'red'],
          result.isValid === false ? `\n  expected:      ${!obfuscate ? result.task.value : '*****'}`.gray : '',
        ].join(''),
  ].join('');
}

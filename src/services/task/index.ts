// Dependencies
import { spawn } from 'child_process';
import { Configuration } from '../config';

// Types
import { TTaskConfiguration } from '../config/types';

/**
 * Implements task management and running functinoality
 */
export class Task implements TTaskConfiguration {
  /**
   * Gets list of all runnable tasks
   * @param tasks Array of tasks to run
   * @param name Start of name of task(s) to run
   * @param type Type of tasks to run
   * @returns List of all runnable tasks
   */
  public static get({ tasks = [] as number[], name = '' as string, type = '' as string } = {}): Task[] {
    return (tasks.length ? tasks : Object.keys(Configuration.config.tasks).map(i => parseInt(i) + 1))
      .map(i => (Configuration.config.tasks || []).map(task => (task ? new Task(task) : undefined))[i - 1])
      .filter(task => !!task)
      .filter(task => !name || task.name.startsWith(name))
      .filter(task => !type || task.type === type);
  }

  /**
   * Runs requested tasks
   * @param argv Startup arguments
   * @param name Start of name of task(s) to run
   * @param type Type of tasks to run
   * @param stdoutCallback: (text: string) => void
   */
  public static async *run(argv: Record<string, string | string[]>, stdoutCallback: (text: string) => void): AsyncGenerator<Task | TaskResult> {
    // Get filters
    const tasks = argv.task instanceof Array ? argv.task.map(task => parseInt(task)) : argv.task ? [parseInt(argv.task)] : [];
    const type = argv.type as string;
    const name = argv.name as string;
    // Filter tasks to execute
    for (const task of Task.get({ tasks, type, name })) {
      // Process task arguments
      task.args = task.args.map(arg => {
        return arg.replace(/\{\{(.*?)\}\}/g, match => {
          const expr = match.substr(2, match.length - 4);
          if (expr.startsWith('verbose')) {
            return argv.verbose ? expr.split('??')[1] : '';
          } else if (expr.startsWith('obfuscate')) {
            return argv.obfuscate ? expr.split('??')[1] : '';
          } else {
            return match;
          }
        });
      });

      // Yield task
      yield await task;

      // Execute task and yield result
      yield await task.run(stdoutCallback);
    }
  }

  public name?: string;
  public type?: string;
  public command: string;
  public args?: string[];
  public value?: string;

  constructor(task: TTaskConfiguration) {
    // Set properties
    this.name = task.name;
    this.type = task.type;
    this.command = task.command;
    this.args = task.args;
    this.value = task.value;
  }

  /**
   * Execute task
   * @returns Task execution result
   * @param stdoutCallback Callback function called on every stdout event
   */
  public async run(stdoutCallback: (text: string) => void): Promise<TaskResult> {
    // Run task and time task execution
    const start = Date.now();
    try {
      // Run command async and stream stdout and stderr
      const out = await new Promise<Error | string>(resolve => {
        try {
          let out = '';
          let err = '';
          const process = spawn(
            // Command
            this.command,
            // Command arguments
            this.args,
            // Process options
            { cwd: Configuration.cwd },
          );
          process.stdout.on('data', (data: string) => {
            out += data.toString();
            stdoutCallback(data.toString());
          });
          process.stderr.on('data', (data: string) => {
            err += data.toString();
            stdoutCallback(data.toString());
          });
          process.on('exit', () => {
            resolve(out || new Error(err));
          });
        } catch (err) {
          resolve(err);
        }
      });

      // Return execution result
      const result =
        out instanceof Error
          ? out
          : out
              .replace(/\[.*?m/g, '')
              .trim()
              .split('\n')
              .slice(-1)[0];
      return new TaskResult(this, Date.now() - start, result, out instanceof Error ? out.message : out);
    } catch (err) {
      // Return execution result
      return new TaskResult(this, Date.now() - start, err);
    }
  }
}

// TODO: expose isError and isValid getters
/**
 * Contains results from an executed task
 */
export class TaskResult {
  /**
   * If error was thrown while executing the task command
   */
  public get isError(): boolean {
    return this.value instanceof Error;
  }

  /**
   * If returned value matches expected value
   */
  public get isValid(): boolean | undefined {
    return !(this.value instanceof Error) ? (this.task.value !== undefined ? this.task.value.trim() === this.value.trim() : undefined) : false;
  }

  constructor(public task: TTaskConfiguration, public time: number, public value: string | Error, public output?: string) {}
}

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
      // Compose and run multiple runs of the task
      let taskRuns = !task.runs ? [task] : task.runs.map(run => new Task({ ...task, ...run }, run));
      for (const taskRun of taskRuns) {
        // Process dynamic task arguments
        taskRun.args = taskRun.args.map(arg => {
          return arg.replace(/\{\{(.*?)\}\}/g, match => {
            // Parse dynamic argument
            const expr = match.substr(2, match.length - 4);
            const parsed = expr.split('??');
            const condition = parsed.length > 1 ? parsed[0] : undefined;
            const syntax = parsed.length > 1 ? parsed[1] : parsed[0];
            // Check if argument enabled
            if (!condition || argv[condition] !== undefined || taskRun.custom[condition] !== undefined || taskRun[condition] !== undefined) {
              // Replace argument with processed version
              return syntax
                .split(' ')
                .map(s => (!s.startsWith(':') ? s : argv[s.substr(1)] || taskRun.custom[s.substr(1)] || taskRun[s.substr(1)]))
                .join(' ');
            }
          });
        });

        // Yield task
        yield await taskRun;

        // Execute task and yield result
        yield await taskRun.run(stdoutCallback);
      }
    }
  }

  public name?: string;
  public type?: string;
  public command: string;
  public args?: string[];
  public value?: string;
  public runs?: Record<string, string>[];
  private custom?: Record<string, string>;

  constructor(task: TTaskConfiguration, custom: Record<string, string> = {}) {
    // Set properties
    this.name = task.name;
    this.type = task.type;
    this.command = task.command;
    this.args = task.args;
    this.value = task.value;
    this.runs = task.runs;
    this.custom = custom;
  }

  /**
   * Gets high resolution time in [ms]
   * @returns High resolution time in [ms]
   */
  private getHRTime(): number {
    const time = process.hrtime();
    return time[0] * 1000 + time[1] / 1e6;
  }

  /**
   * Execute task
   * @returns Task execution result
   * @param stdoutCallback Callback function called on every stdout event
   */
  public async run(stdoutCallback: (text: string) => void): Promise<TaskResult> {
    // Run task and time task execution
    const time = this.getHRTime();
    let timeSpawned: number = time;
    let timeStd: number = time;
    try {
      // Run command async and stream stdout and stderr
      const out = await new Promise<Error | string>(resolve => {
        try {
          let out = '';
          let err = '';
          const proc = spawn(
            // Command
            this.command,
            // Command arguments
            this.args,
            // Process options
            { cwd: Configuration.cwd },
          );
          proc.on('spawn', () => {
            timeSpawned = this.getHRTime();
          });
          proc.stdout.on('data', (data: string) => {
            out += data.toString();
            stdoutCallback(data.toString());
            timeStd = this.getHRTime();
          });
          proc.stderr.on('data', (data: string) => {
            err += data.toString();
            stdoutCallback(data.toString());
            timeStd = this.getHRTime();
          });
          proc.on('exit', () => {
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
      return new TaskResult(this, timeStd - timeSpawned, result, out instanceof Error ? out.message : out);
    } catch (err) {
      // Return execution result
      return new TaskResult(this, timeStd - timeSpawned, err);
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

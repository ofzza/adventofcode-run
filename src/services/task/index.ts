// Dependencies
import { execSync } from 'child_process';
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
   * @param tasks Array of tasks to run
   * @param name Start of name of task(s) to run
   * @param type Type of tasks to run
   */
  public static *run({ tasks = [] as number[], name = '' as string, type = '' as string } = {}): Generator<TaskResult> {
    // Filter tasks to execute
    for (const task of Task.get({ tasks, type, name })) {
      yield task.run();
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
   */
  public run(): TaskResult {
    const start = Date.now();
    try {
      // Run task and time task execution
      const out = execSync(`${this.command} ${this.args.join(' ')}`, { cwd: Configuration.cwd, stdio: [null, null] }).toString();
      // Return execution result
      return new TaskResult(this, Date.now() - start, out.trim().split('\n').slice(-1)[0], out);
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

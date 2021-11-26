/**
 * Configuration type
 */
export interface TConfiguration {
  // General information
  author: string;
  year: number;
  // Tasks
  tasks: TTaskConfiguration[];
}

/**
 * Configured task
 */
export interface TTaskConfiguration {
  // General information
  name?: string;
  type?: string;
  // Command
  command: string;
  args?: string[];
  // Valid result
  value?: string;
}

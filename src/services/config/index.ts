// Dependencies
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

// Import default configuration
import defaultConfiguration from './default.json';

// Types
import { TConfiguration } from './types';
export * from './types';

/**
 * Implements configuration reading and processing functionality
 */
export class Configuration {
  /**
   * Gets initialized configuration (and initializes it if not already initialized)
   */
  public static get config(): TConfiguration {
    return Configuration._config;
  }

  /**
   * Holds initialized configuration
   */
  private static _config: TConfiguration;

  /**
   * Gets task execution CWD  (same as location of configuration file)
   */
  public static get cwd(): string {
    return Configuration._cwd;
  }

  /**
   * Holds task execution CWD  (same as location of configuration file)
   */
  private static _cwd: string;

  /**
   * Writes default configuration into a config file
   */
  public static writeDefault(path: string) {
    try {
      const absolutePath = join(process.cwd(), path);
      writeFileSync(absolutePath, JSON.stringify(defaultConfiguration, null, 2));
    } catch (err) {
      throw err;
    }
  }

  /**
   * Reads and parses configuration
   */
  public static initialize(path: string) {
    try {
      this._cwd = dirname(path);
      const absolutePath = join(process.cwd(), path);
      let syntax = readFileSync(absolutePath).toString();
      syntax = syntax
        .split('\n')
        .filter(line => !line.trim().startsWith('//'))
        .join('\n');
      this._config = JSON.parse(syntax) as TConfiguration;
    } catch (err) {
      throw err;
    }
  }
}

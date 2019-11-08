import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { LoggingService } from '../logging/logging.service';
import { Injectable } from '@nestjs/common';
import Joi = require('@hapi/joi');

export type EnvConfig = Record<string, string>;

/**
 * Maps a dotenv configuration file to a key:value record.
 * https://docs.nestjs.com/techniques/configuration
 */
@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(private readonly logger: LoggingService) {
    // We may want to make this customizable for swapping different configurations.
    const filePath = `../config.env`;

    try {
      const config = dotenv.parse(fs.readFileSync(filePath));
      this.envConfig = this.validateConfig(config);
    } catch (error) {
      // No such file or directory error code.
      if (error.code !== 'ENOENT') {
        throw error;
      }

      this.logger.error(`The configuration file ${filePath} was not found. Shutting down!`, null, true);
    }
  }

  /**
   * Checks the env file to provide the required values.
   * @param envConfig Dotenv parsed configuration file.
   */
  private validateConfig(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
      PORT: Joi.number().default(3000),
      DATABASE_TYPE: Joi.string()
        .valid('postgres', 'mysql')
        .required(),
      DATABASE_HOST: Joi.string().required(),
      DATABASE_PORT: Joi.number().required(),
      DATABASE_USERNAME: Joi.string().required(),
      DATABASE_PASSWORD: Joi.string().required(),
      DATABASE_NAME: Joi.string().required(),
      DATABASE_SYNCHRONIZE: Joi.boolean(),
      DATABASE_SSL: Joi.boolean(),
    });

    const { error, value: validatedEnvConfig } = envVarsSchema.validate(envConfig);

    if (error) {
      this.logger.error(`Configuration validation error ${error.message}`, null, true);
    }

    return validatedEnvConfig;
  }

  /**
   * Returns a value from a specified key.
   * @param key Case sensitive key
   */
  get(key: string): string {
    return this.envConfig[key];
  }

  /**
   * Returns a boolean from a specified key.
   * @param key Case sensitive key
   */
  getBoolean(key: string): boolean {
    return Boolean(this.envConfig[key]);
  }

  /**
   * Returns a numberfrom a specified key.
   * @param key Case sensitive key
   */
  getNumber(key: string): number {
    return Number(this.envConfig[key]);
  }
}

import fs from 'node:fs/promises';
import {parse} from 'yaml';
import { configSchema } from './config-schema';
export async function parseYAMLConfig(filePath: string){
    const configFileContent=await fs.readFile(filePath, 'utf8');
    const config=parse(configFileContent);
    return JSON.stringify(config);
}

export async function validateConfig(config: string){
    const validateConfig=await configSchema.parseAsync(JSON.parse(config));
    return validateConfig;
}
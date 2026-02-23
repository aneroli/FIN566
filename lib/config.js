// lib/config.js
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

export function loadConfig() {
  const configPath = path.join(process.cwd(), 'config.yaml');
  const yamlText = fs.readFileSync(configPath, 'utf8');
  return yaml.parse(yamlText);
}

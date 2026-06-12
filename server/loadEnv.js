import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const parseEnvLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const separatorIndex = trimmed.indexOf('=');
  if (separatorIndex === -1) return null;

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();
  if (!key) return null;

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
};

const loadEnvFile = (filename) => {
  const filePath = path.join(projectRoot, filename);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const physicalLines = content.split(/\r?\n/);
  const lines = [];

  for (let i = 0; i < physicalLines.length; i += 1) {
    let line = physicalLines[i];
    const separatorIndex = line.indexOf('=');
    const value = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1).trim();

    if (
      separatorIndex !== -1 &&
      (value.startsWith('"') || value.startsWith("'")) &&
      !value.endsWith(value[0])
    ) {
      const quote = value[0];
      while (i + 1 < physicalLines.length && !line.trimEnd().endsWith(quote)) {
        i += 1;
        line += physicalLines[i].trim();
      }
    }

    lines.push(line);
  }

  for (const line of lines) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    if (process.env[parsed.key] == null) {
      process.env[parsed.key] = parsed.value;
    }
  }
};

loadEnvFile('.env');
loadEnvFile('.env.local');
loadEnvFile('.env.production');

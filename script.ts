// generate-config.ts
import * as fs from 'fs';
import * as path from 'path';

interface Arg {
  name: string;
  type: string;
  validation?: Record<string, any>;
}

interface FunctionDef {
  name: string;
  type: 'read' | 'write';
  description: string;
  args: Arg[];
}

interface ModuleConfig {
  namespace: string;
  module: string;
  functions: FunctionDef[];
}

const parseFunctionLine = (line: string): { name: string; args: Arg[] } | null => {
  const defunMatch = line.match(/\(defun\s+([a-zA-Z0-9\-]+)\s*\(([^)]*)\)/);
  if (!defunMatch) return null;

  const name = defunMatch[1];
  const argsRaw = defunMatch[2] || '';

  const args: Arg[] = argsRaw
    .split(/\s+/)
    .map(arg => arg.trim())
    .filter(Boolean)
    .map(arg => {
      const [name, type] = arg.split(':');
      return { name, type: type || 'any' };
    });

  return { name, args };
};

const inferFunctionType = (block: string): 'read' | 'write' => {
  return /write|with-capability|enforce-keyset/.test(block) ? 'write' : 'read';
};

const extractDescription = (lines: string[], index: number): string => {
  for (let i = index; i < Math.min(lines.length, index + 5); i++) {
    const docMatch = lines[i].match(/@doc\s+\"(.+?)\"/);
    if (docMatch) return docMatch[1];
  }
  return '';
};

const generateConfig = (contract: string): ModuleConfig => {
  const lines = contract.split('\n');
  let namespace = 'free';
  let module = 'unknown';
  const functions: FunctionDef[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes("(namespace '")) {
      const nsMatch = line.match(/\(namespace\s+'([a-zA-Z0-9\-]+)/);
      if (nsMatch) namespace = nsMatch[1];
    }

    if (line.includes('(module ')) {
      const modMatch = line.match(/\(module\s+([a-zA-Z0-9\-]+)/);
      if (modMatch) module = modMatch[1];
    }

    if (line.includes('(defun')) {
      const fnMeta = parseFunctionLine(line);
      if (!fnMeta) continue;

      const description = extractDescription(lines, i);

      // try to read the block of code after defun
      let block = '';
      let j = i;
      let openParens = 0;
      do {
        const l = lines[j];
        openParens += (l.match(/\(/g) || []).length;
        openParens -= (l.match(/\)/g) || []).length;
        block += l + '\n';
        j++;
      } while (j < lines.length && openParens > 0);

      functions.push({
        name: fnMeta.name,
        args: fnMeta.args,
        type: inferFunctionType(block),
        description,
      });
    }
  }

  return { namespace, module, functions };
};

const main = () => {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: ts-node generate-config.ts <path-to-pact-file>');
    process.exit(1);
  }

  const source = fs.readFileSync(path.resolve(inputPath), 'utf-8');
  const config = generateConfig(source);
  console.log(JSON.stringify(config, null, 2));
};

main();
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TIMEOUT = 5000;
const TEMP_DIR = path.join(__dirname, 'temp');

await fs.mkdir(TEMP_DIR, { recursive: true });

const languageConfigs = {
  javascript: {
    extension: 'js',
    compile: null,
    execute: (filename) => `node "${filename}"`
  },
  python: {
    extension: 'py',
    compile: null,
    execute: (filename) => `python "${filename}"`
  },
  java: {
    extension: 'java',
    compile: (filename) => `javac "${filename}"`,
    execute: (filename) => {
      const className = path.basename(filename, '.java');
      const dir = path.dirname(filename);
      return `cd "${dir}" && java ${className}`;
    }
  },
  c: {
    extension: 'c',
    compile: (filename, outputFile) => `gcc "${filename}" -o "${outputFile}"`,
    execute: (outputFile) => `"${outputFile}"`
  },
  cpp: {
    extension: 'cpp',
    compile: (filename, outputFile) => `g++ "${filename}" -o "${outputFile}"`,
    execute: (outputFile) => `"${outputFile}"`
  }
};

export const executeCodeInSandbox = async (code, language, input = '') => {
  const startTime = Date.now();
  const config = languageConfigs[language.toLowerCase()];

  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const timestamp = Date.now();
  const filename = path.join(TEMP_DIR, `code_${timestamp}.${config.extension}`);
  const outputFile = path.join(TEMP_DIR, `output_${timestamp}`);

  try {
    await fs.writeFile(filename, code);

    if (config.compile) {
      const compileCmd = config.compile(filename, outputFile);
      try {
        await execPromise(compileCmd, { timeout: TIMEOUT });
      } catch (error) {
        return {
          success: false,
          output: '',
          error: error.stderr || error.message,
          executionTime: Date.now() - startTime
        };
      }
    }

    const executeCmd = config.execute(config.compile ? outputFile : filename);
    
    try {
      const { stdout, stderr } = await execPromise(executeCmd, {
        timeout: TIMEOUT,
        input: input || undefined
      });

      return {
        success: true,
        output: stdout || stderr,
        error: stderr && !stdout ? stderr : null,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      if (error.killed) {
        return {
          success: false,
          output: '',
          error: 'Execution timeout (5 seconds)',
          executionTime: TIMEOUT
        };
      }

      return {
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message,
        executionTime: Date.now() - startTime
      };
    }
  } finally {
    try {
      await fs.unlink(filename);
      if (config.compile) {
        await fs.unlink(outputFile).catch(() => {});
        if (language.toLowerCase() === 'java') {
          const className = path.basename(filename, '.java');
          const classFile = path.join(TEMP_DIR, `${className}.class`);
          await fs.unlink(classFile).catch(() => {});
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
};

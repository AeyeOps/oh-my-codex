import { spawn } from 'node:child_process';
import { resolveOmxCliEntryPath } from '../utils/paths.js';
export class OmxQuestionError extends Error {
    code;
    payload;
    stdout;
    stderr;
    exitCode;
    constructor(code, message, options = {}) {
        super(`${code}: ${message}`);
        this.name = 'OmxQuestionError';
        this.code = code;
        this.payload = options.payload;
        this.stdout = options.stdout ?? '';
        this.stderr = options.stderr ?? '';
        this.exitCode = options.exitCode ?? null;
    }
}
export async function defaultOmxQuestionProcessRunner(command, args, options) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: options.cwd,
            env: options.env,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk) => {
            stdout += String(chunk);
        });
        child.stderr.on('data', (chunk) => {
            stderr += String(chunk);
        });
        child.on('error', reject);
        child.on('close', (code) => resolve({ code, stdout, stderr }));
    });
}
function parseQuestionStdout(stdout, stderr, exitCode) {
    const trimmed = stdout.trim();
    if (!trimmed) {
        throw new OmxQuestionError('question_no_stdout', 'omx question did not emit a JSON response on stdout.', {
            stdout,
            stderr,
            exitCode,
        });
    }
    try {
        return JSON.parse(trimmed);
    }
    catch (error) {
        throw new OmxQuestionError('question_invalid_stdout', `omx question emitted invalid JSON on stdout: ${error.message}`, { stdout, stderr, exitCode });
    }
}
export async function runOmxQuestion(input, options = {}) {
    const cwd = options.cwd ?? process.cwd();
    const env = options.env ?? process.env;
    const omxBin = resolveOmxCliEntryPath({ argv1: options.argv1, cwd, env });
    if (!omxBin) {
        throw new OmxQuestionError('question_cli_not_found', 'Could not resolve the omx CLI entrypoint for blocking question execution.');
    }
    const runner = options.runner ?? defaultOmxQuestionProcessRunner;
    const result = await runner(process.execPath, [omxBin, 'question', '--json', '--input', JSON.stringify(input)], { cwd, env });
    const payload = parseQuestionStdout(result.stdout, result.stderr, result.code);
    if (!payload.ok) {
        throw new OmxQuestionError(payload.error.code, payload.error.message, {
            payload,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.code,
        });
    }
    if (result.code !== 0) {
        throw new OmxQuestionError('question_nonzero_exit', `omx question returned an answer but exited with code ${result.code}.`, { stdout: result.stdout, stderr: result.stderr, exitCode: result.code });
    }
    return payload;
}
//# sourceMappingURL=client.js.map
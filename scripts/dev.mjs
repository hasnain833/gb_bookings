// Runs the API and the Vite frontend together; Ctrl+C stops both.
import { spawn } from 'node:child_process';

const children = ['dev:backend', 'dev:frontend'].map((script) =>
  spawn('npm', ['run', script], { stdio: 'inherit', shell: true }),
);

const stop = () => children.forEach((child) => child.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
children.forEach((child) => child.on('exit', (code) => {
  stop();
  process.exitCode = code ?? 0;
}));

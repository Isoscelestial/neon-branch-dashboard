import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function dumpDatabase() {
  // await execAsync(`pg_dump`)
}
import fs from 'fs/promises';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const dumpDir = '.dump';

async function makeDumpDir() {
  try {
    await mkdir(dumpDir, { recursive: true });
  } catch (error) {
    console.error('Could not create dump dir', error);
  }
}

function spawnPgDump(databaseURL: string, filename: string) {
  return new Promise((resolve, reject) => {
    const child = spawn('pg_dump', [
      '-Fc',
      '-v',
      '-d',
      `${databaseURL}`,
      '-f',
      `${path.join(dumpDir, filename)}`,
    ]);

    child.stdout.on('data', (data) => console.log(`${data}`));
    child.stderr.on('data', (data) => console.error(`${data}`));

    child.on('close', (code) => {
      if (code) {
        reject(new Error(`pg_dump exited with code ${code}`));
      } else {
        resolve(`pg_dump finished successfully`);
      }
    });
  });
}

function spawnPgRestore(databaseURL: string, filename: string) {
  return new Promise((resolve, reject) => {
    const child = spawn('pg_restore', [
      '-v',
      '-c',
      '-d',
      `${databaseURL}`,
      `${path.join(dumpDir, filename)}`,
    ]);

    child.stdout.on('data', (data) => console.log(`${data}`));
    child.stderr.on('data', (data) => console.error(`${data}`));

    child.on('close', (code) => {
      if (code) {
        reject(new Error(`pg_restore exited with code ${code}`));
      } else {
        resolve(`pg_restore finished successfully`);
      }
    });
  });
}

export async function dumpDatabase(
  databaseURL: string,
  filename: string = 'prod.dump',
) {
  await makeDumpDir();
  try {
    await spawnPgDump(databaseURL, filename);
    console.log(`Successfully dumped database to file ${filename}`);
  } catch (error) {
    console.error('Failed to dump database.', error);
  }
}

export async function restoreDatabase(
  databaseURL: string,
  filename: string = 'prod.dump',
) {
  await makeDumpDir();
  try {
    await spawnPgRestore(databaseURL, filename);
    console.log(`Successfully restored database from file ${filename}`);
  } catch (error) {
    console.error('Failed to restore database.', error);
  }
}

export async function checkIfDumpExists(
  filename: string = 'prod.dump',
): Promise<boolean> {
  try {
    await fs.access(path.join(dumpDir, filename), fs.constants.F_OK);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

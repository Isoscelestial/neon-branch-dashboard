import { Branch } from '@neon/sdk';
import neon from '@/utils/neon';
import { dev } from '@/utils/templates';
import rl from '@/utils/readline';
import confirmation from '@/utils/confirmation';

const commands = new Map<string | string[], (...args: any[]) => any>();

const helpMessage = `Available commands for Neon Branch Dashboard CLI:
  help, h - Shows this help message
  get, g - Gets connection string for an existing branch
  dev, d - Gets connection string for a developer's branch given their username. If missing, creates a branch
  exit, quit, q - End session`;

commands.set(['help', 'h'], () => {
  console.log(helpMessage);
});

const project_id = process.env.NEON_PROJECT_ID!;
const projectId = process.env.NEON_PROJECT_ID!;

async function getBranches(): Promise<Branch[]> {
  // // It appears there's a bug with the Neon Management SDK. The following should work but it crashes, hence why we're manually fetching from the Neon API
  // const { all } = neon.branches.list({ projectId });
  // const { data: branches } = await all();

  const params = new URLSearchParams({
    project_id,
  });

  const res = await fetch(
    `${process.env.NEON_API_URL}/projects/${process.env.NEON_PROJECT_ID}/branches?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.NEON_API_KEY}`,
      },
    },
  );

  const data = await res.json();

  return data.branches as Branch[];
}

//
// GET
//
commands.set(['get', 'g'], async (branchName?: string) => {
  if (!branchName) {
    console.log('Branch name is required');
    return;
  }

  const branches = await getBranches();

  const branch = branches.find((branch) => branch.name === branchName);

  if (!branch) {
    console.log(`Could not find a branch called "${branchName}"`);
    return;
  }

  const { data: uri } = await neon.postgres.connectionString({
    projectId: process.env.NEON_PROJECT_ID!,
    databaseName: 'neondb',
    roleName: 'neondb_owner',
    branchId: branch.id,
  });

  if (!uri) {
    console.log(`Failed to fetch connection string for branch "${branchName}"`);
    return;
  }

  console.log(uri);
});

//
// DEV
//
commands.set(['dev', 'd'], async (githubUsername?: string) => {
  if (!githubUsername) {
    console.log('githubUsername is required');
    return;
  }

  const branches = await getBranches();

  let branch = branches.find((branch) => branch.name === dev(githubUsername));
  let uri;

  if (!branch) {
    const response = await confirmation(
      `Could not find a branch called "${dev(githubUsername)}". Would you like to create this branch?`,
    );
    if (!response) {
      console.log('Never mind');
      return;
    }

    const { data, error } = await neon.branches.createAndConnect({
      projectId,
      name: dev(githubUsername),
    });

    if (data) {
      uri = data.connectionString;
    }
  } else {
    uri = (
      await neon.postgres.connectionString({
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: 'neondb',
        roleName: 'neondb_owner',
        branchId: branch.id,
      })
    ).data;

    if (!uri) {
      console.log(
        `Failed to fetch connection string for branch "${dev(githubUsername)}"`,
      );
      return;
    }
  }

  console.log(uri);
});

export default commands;

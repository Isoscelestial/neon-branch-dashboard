import { Branch } from '@neon/sdk';
import neon from '@/utils/neon';
import { dev } from '@/utils/templates';
import rl from '@/utils/readline';
import confirmation from '@/utils/confirmation';
import octokit from '@/utils/octokit';
import { RequestError } from 'octokit';

const commands = new Map<string | string[], (...args: any[]) => any>();

const helpMessage = `Available commands for Neon Branch Dashboard CLI:
  help, h    # Shows this help message
  get, g       [branchName]    # Gets connection string for an existing branch
  dev, d       [githubUsername]    # Gets connection string for a developer's branch given their username. If missing, creates a branch
  exit,
  quit, q    # End session`;

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

/** Verifies that the provided GitHub account is in the engineering division of the Nebula Labs org */
async function inGitHubOrg(
  githubUsername: string,
): Promise<boolean | 'notEngineer'> {
  const checkInOrg = async (): Promise<boolean> => {
    try {
      const { status } = await octokit.rest.orgs.checkMembershipForUser({
        org: 'UTDNebula',
        username: githubUsername,
      });

      switch (status as number) {
        case 204:
          return true;
        case 302:
          return false;
      }
    } catch (e) {
      if ((e as RequestError).status === 404) {
        return false;
      }

      console.error(
        `There was an error checking if "${githubUsername}" is in the organization:`,
        e,
      );
    }
    return false;
  };

  const checkIsEngineer = async (): Promise<boolean> => {
    try {
      const { data } = await octokit.rest.teams.getMembershipForUserInOrg({
        org: 'UTDNebula',
        team_slug: 'engineering',
        username: githubUsername,
      });

      return data.state === 'active';
    } catch (e) {
      if ((e as RequestError).status === 404) {
        return false;
      }

      console.error(
        `There was an error checking if "${githubUsername}" is in the Engineering team:`,
        e,
      );
    }
    return false;
  };

  const isEngineer = await checkIsEngineer();
  const inOrg = isEngineer ? true : await checkInOrg();

  if (inOrg && !isEngineer) return 'notEngineer';
  return inOrg;
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

  const branchName = dev(githubUsername.toLowerCase());

  const branches = await getBranches();

  let branch = branches.find(
    (branch) => branch.name.toLowerCase() === branchName,
  );

  if (!branch) {
    const response = await confirmation(
      `Could not find a branch called "${branchName}". Would you like to create this branch?`,
    );
    if (!response) {
      console.log("Won't create a branch");
      return;
    }

    const inOrg = await inGitHubOrg(githubUsername);

    if (!inOrg) {
      const response = await confirmation(
        `${githubUsername} is NOT in the UTDNebula GitHub organization. Against recommendations, are you sure you want to create this branch?`,
      );
      if (!response) {
        console.log("Won't create a branch");
        return;
      }
    }
    if (inOrg === 'notEngineer') {
      const response = await confirmation(
        `${githubUsername} is in the UTDNebula GitHub organization, but not in the engineering team. Would you like to create the branch anyway?`,
      );
      if (!response) {
        console.log("Won't create a branch");
        return;
      }
    }

    console.log('→ Creating branch...');
    const { data: newBranch, error: createError } = await neon.branches.create({
      projectId,
      name: branchName,
    });
    if (createError) {
      console.error(
        `There was an error creating branch "${branchName}":`,
        createError,
      );
      return;
    }

    console.log('→ Resetting to unique password...');
    const { error: resetPasswordError } =
      await neon.postgres.roles.resetPassword({
        projectId,
        branchId: newBranch.id,
        roleName: 'neondb_owner',
      });
    if (resetPasswordError) {
      console.error(
        `There was an error resetting to a unique password for the branch "${branchName}":`,
        createError,
      );
      console.warn(
        'This connection string will have the same password as the default branch, which is more unsecure. Careful who you send this one to.',
      );
    }

    branch = newBranch;
  }

  console.log('→ Fetching connection string...');
  const uri = (
    await neon.postgres.connectionString({
      projectId: process.env.NEON_PROJECT_ID!,
      databaseName: 'neondb',
      roleName: 'neondb_owner',
      branchId: branch.id,
    })
  ).data;

  if (!uri) {
    console.log(`Failed to fetch connection string for branch "${branchName}"`);
    return;
  }

  console.log(uri);
});

export default commands;

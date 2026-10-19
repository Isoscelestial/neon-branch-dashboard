import env, { hasEnvVar, requireEnvVar } from '@/env';
import { createCommand } from '@/lib/cli/commands';
import confirmation from '@/lib/cli/confirmation';
import neon from '@/lib/sdk/neon';
import getBranches from '@/lib/utils/getBranches';
import inGitHubOrg from '@/lib/utils/inGitHubOrg';
import { dev } from '@/lib/utils/templates';

export const DevCMD = createCommand({
  command: ['dev', 'd'],
  async function(githubUsername?: string) {
    requireEnvVar('NEON_PROJECT_ID');

    const projectId = env.NEON_PROJECT_ID!;

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

      if (hasEnvVar('GITHUB_TOKEN')) {
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
      } else if (
        !(await confirmation(
          `Cannot check if ${githubUsername} is in the UTDNebula GitHub organization because the GITHUB_TOKEN environment variable is missing.\nAgainst recommendations, would you like to create the branch anyway?`,
        ))
      ) {
        console.log("Won't create a branch");
        return;
      }

      console.log('→ Creating branch...');
      const { data: newBranch, error: createError } =
        await neon.branches.create({
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
        projectId: env.NEON_PROJECT_ID!,
        databaseName: 'neondb',
        roleName: 'neondb_owner',
        branchId: branch.id,
      })
    ).data;

    if (!uri) {
      console.log(
        `Failed to fetch connection string for branch "${branchName}"`,
      );
      return;
    }

    console.log(uri);
  },
});

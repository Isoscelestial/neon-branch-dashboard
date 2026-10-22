import env, { hasEnvVar } from '@/env';
import { createCommand } from '@/lib/cli/commands';
import confirmation from '@/lib/cli/confirmation';
import neon from '@/lib/sdk/neon';
import getBranches from '@/lib/utils/getBranches';
import inGitHubOrg from '@/lib/utils/inGitHubOrg';
import { getNeonProjectId } from '@/lib/utils/projects';
import { dev } from '@/lib/utils/templates';

export const DevCMD = createCommand({
  command: ['dev', 'd'],
  description:
    "List branches for a developer and fetch connection strings for a developer's branch",
  help: "Usage: dev <project> <githubUsername> [index]\n List a developer's branches:\n  dev <project> <githubUsername>\n Fetch connection string for a developer's branch at that index (if missing, prompts to create the branch):\n  dev <project> <githubUsername> <index>",
  async function(project, githubUsername, indexParam) {
    if (!project) {
      console.log('project is required');
      return;
    }

    const projectId = getNeonProjectId(project);

    if (!githubUsername) {
      console.log('githubUsername is required');
      return;
    }
    const index = indexParam ? Number(indexParam) : 0;
    if (index && (!Number.isInteger(index) || index < 0)) {
      console.error('Invalid index for branch name');
      return;
    }

    const branchName = dev(githubUsername.toLowerCase(), index);
    const escapedBranchName = branchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Matches all branches that belong to username
    const matchingBranchesRegex = new RegExp(
      `^${escapedBranchName}(?=[# ]+|$)`,
    );

    // Matches branch that starts with branchName, while avoiding conflicts
    const branchNamePrefixRegex = new RegExp(
      `^${escapedBranchName}(?!#)(?=[# ]+|$)`,
    );

    const allBranches = await getBranches(projectId);

    // If no index provided, list matching branches
    if (!indexParam) {
      const branches = allBranches.filter((branch) =>
        matchingBranchesRegex.test(branch.name.toLowerCase()),
      );

      if (branches.length !== 0) {
        console.log(
          `Found ${branches.length} ${branches.length === 1 ? 'branch' : 'branches'} for ${githubUsername}:`,
        );
        branches.forEach((branch) => {
          const index = Number(branch.name.match(/(?<=(.+#))\d*/)?.[0] ?? 0);

          console.log(`${String(index).padStart(2, ' ')} ${branch.name}`);
        });
        console.log(
          'Run command again with [index] provided to get connection string for that branch',
        );
      } else {
        console.log(`Did not find any branches for ${githubUsername}`);
      }

      return;
    }

    let branch = allBranches.find((branch) =>
      branchNamePrefixRegex.test(branch.name.toLowerCase()),
    );

    if (!branch) {
      const response = await confirmation(
        `Could not find a branch called "${branchName}". Would you like to create this branch?`,
      );
      if (!response) {
        console.log("Won't create a branch");
        return;
      }

      if (hasEnvVar('GITHUB_ORG')) {
        const GITHUB_ORG = env.GITHUB_ORG!;
        const GITHUB_TEAM_SLUG = env.GITHUB_TEAM_SLUG;

        if (hasEnvVar('GITHUB_TOKEN')) {
          const inOrg = await inGitHubOrg(
            githubUsername,
            GITHUB_ORG,
            GITHUB_TEAM_SLUG,
          );

          if (!inOrg) {
            if (
              !(await confirmation(
                `${githubUsername} is NOT in the ${GITHUB_ORG} GitHub organization. Against recommendations, are you sure you want to create this branch?`,
              ))
            ) {
              console.log("Won't create a branch");
              return;
            }
          }
          if (inOrg === 'notInTeam') {
            if (
              !(await confirmation(
                `${githubUsername} is in the ${GITHUB_ORG} GitHub organization, but not in the ${GITHUB_TEAM_SLUG} team. Would you like to create the branch anyway?`,
              ))
            ) {
              console.log("Won't create a branch");
              return;
            }
          }
        } else if (
          !(await confirmation(
            `Cannot check if ${githubUsername} is in the ${GITHUB_ORG} GitHub organization because the GITHUB_TOKEN environment variable is missing.\nAgainst recommendations, would you like to create the branch anyway?`,
          ))
        ) {
          console.log("Won't create a branch");
          return;
        }
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
        projectId: projectId,
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

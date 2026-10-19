import { requireEnvVar } from '@/env';
import octokit from '@/lib/sdk/octokit';
import { RequestError } from 'octokit';

/**
 * Verifies that the provided GitHub account is in a specific GitHub org (and optionally whether it is in a specific
 * team within that org).
 */
export default async function inGitHubOrg(
  githubUsername: string,
  githubOrg: string,
  githubOrgTeam?: string,
): Promise<boolean | 'notInTeam'> {
  requireEnvVar('GITHUB_TOKEN');

  const checkInOrg = async (): Promise<boolean> => {
    try {
      const { status } = await octokit.rest.orgs.checkMembershipForUser({
        org: githubOrg,
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
        `There was an error checking if "${githubUsername}" is in the "${githubOrg}" organization:`,
        e,
      );
    }
    return false;
  };

  const checkIsEngineer = async (): Promise<boolean> => {
    try {
      const { data } = await octokit.rest.teams.getMembershipForUserInOrg({
        org: githubOrg,
        team_slug: githubOrgTeam ?? '',
        username: githubUsername,
      });

      return data.state === 'active';
    } catch (e) {
      if ((e as RequestError).status === 404) {
        return false;
      }

      console.error(
        `There was an error checking if "${githubUsername}" is in the "${githubOrgTeam}" team:`,
        e,
      );
    }
    return false;
  };

  if (!githubOrgTeam) {
    return await checkInOrg();
  } else {
    const inTeam = await checkIsEngineer();
    const inOrg = inTeam ? true : await checkInOrg();

    if (inOrg && !inTeam) return 'notInTeam';
    return inOrg;
  }
}

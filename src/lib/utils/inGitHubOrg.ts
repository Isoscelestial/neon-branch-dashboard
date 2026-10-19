import { requireEnvVar } from '@/env';
import octokit from '@/lib/sdk/octokit';
import { RequestError } from 'octokit';

/** Verifies that the provided GitHub account is in the engineering division of the Nebula Labs org */
export default async function inGitHubOrg(
  githubUsername: string,
): Promise<boolean | 'notEngineer'> {
  requireEnvVar('GITHUB_TOKEN');

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

import neon from '@/lib/sdk/neon';
import getBranches from './getBranches';
import env, { requireEnvVar } from '@/env';

export default async function getConnectionString(
  branchName: string,
  pooled: boolean = true,
): Promise<string | undefined> {
  requireEnvVar('NEON_PROJECT_ID');

  if (!branchName) {
    console.error('Branch name is required');
    return;
  }

  const branches = await getBranches();

  const branch = branches.find((branch) => branch.name === branchName);

  if (!branch) {
    console.error(`Could not find a branch called "${branchName}"`);
    return;
  }

  const { data: uri } = await neon.postgres.connectionString({
    projectId: env.NEON_PROJECT_ID!,
    databaseName: 'neondb',
    roleName: 'neondb_owner',
    branchId: branch.id,
    pooled: pooled,
  });

  if (!uri) {
    console.error(
      `Failed to fetch connection string for branch "${branchName}"`,
    );
    return;
  }

  return uri;
}

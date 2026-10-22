import neon from '@/lib/sdk/neon';
import getBranches from './getBranches';
import env, { requireEnvVar } from '@/env';

export default async function getConnectionString(
  projectId: string,
  branchName: string,
  pooled: boolean = true,
): Promise<string | undefined> {
  if (!branchName) {
    console.error('Branch name is required');
    return;
  }

  const branches = await getBranches(projectId);

  const branch = branches.find((branch) => branch.name === branchName);

  if (!branch) {
    console.error(`Could not find a branch called "${branchName}"`);
    return;
  }

  const { data: uri } = await neon.postgres.connectionString({
    projectId: projectId,
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

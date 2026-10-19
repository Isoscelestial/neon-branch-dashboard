import neon from '@/lib/sdk/neon';
import getBranches from './getBranches';

export default async function getConnectionString(
  branchName: string,
): Promise<string | undefined> {
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
    projectId: process.env.NEON_PROJECT_ID!,
    databaseName: 'neondb',
    roleName: 'neondb_owner',
    branchId: branch.id,
  });

  if (!uri) {
    console.error(
      `Failed to fetch connection string for branch "${branchName}"`,
    );
    return;
  }

  return uri;
}

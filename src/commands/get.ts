import neon from '@/lib/sdk/neon';
import { createCommand } from '@/lib/cli/commands';
import getBranches from '@/lib/utils/getBranches';

export const GetCMD = createCommand({
  command: ['get', 'g'],
  async function(branchName?: string) {
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
      console.log(
        `Failed to fetch connection string for branch "${branchName}"`,
      );
      return;
    }

    console.log(uri);
  },
});

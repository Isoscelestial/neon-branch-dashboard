import { createCommand } from '@/lib/cli/commands';
import getConnectionString from '@/lib/utils/getConnectionString';
import { getNeonProjectId } from '@/lib/utils/projects';

export const GetCMD = createCommand({
  command: ['get', 'g'],
  description: 'Gets connection string for an existing branch',
  help: 'Usage: get <project> <branchName>',
  async function(project, branchName) {
    if (!project) {
      console.log('project is required');
      return;
    }

    const projectId = getNeonProjectId(project);
    const uri = await getConnectionString(projectId, branchName ?? '');
    if (uri) console.log(uri);
  },
});

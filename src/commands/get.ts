import { createCommand } from '@/lib/cli/commands';
import getConnectionString from '@/lib/utils/getConnectionString';

export const GetCMD = createCommand({
  command: ['get', 'g'],
  description: 'Gets connection string for an existing branch',
  help: 'Usage: get <branchName>',
  async function(branchName) {
    const uri = await getConnectionString(branchName ?? '');
    if (uri) console.log(uri);
  },
});

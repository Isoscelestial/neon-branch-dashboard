import { createCommand } from '@/lib/cli/commands';
import getConnectionString from '@/lib/utils/getConnectionString';

export const GetCMD = createCommand({
  command: ['get', 'g'],
  helpMessage: 'Gets connection string for an existing branch',
  async function(branchName?: string) {
    const uri = await getConnectionString(branchName ?? '');
    if (uri) console.log(uri);
  },
});

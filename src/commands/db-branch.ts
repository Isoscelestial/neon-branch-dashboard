import env, { requireEnvVar } from '@/env';
import { createCommand } from '@/lib/cli/commands';

export const DBbranchCMD = createCommand({
  command: 'db-branch',
  description: 'Database branch management (for Discord bot)',
  help: 'Usage: db-branch <action> <githubUsername>\n\nActions:\n  request\n  getURL\n  list\n  delete\n  reset',
  async function(action, githubUsername, ...args) {
    const projectId = requireEnvVar('NEON_PROJECT_ID');

    if (!githubUsername) {
      console.log('githubUsername is required');
      return;
    }

    switch (action?.toLowerCase()) {
      case 'request': {
        break;
      }
      case 'geturl': {
        break;
      }
      case 'list': {
        break;
      }
      case 'delete': {
        break;
      }
      case 'reset': {
        break;
      }
      default:
        console.error(
          `Invalid action: ${action}. Valid actions: request, getURL, list, delete, reset`,
        );
        break;
    }
  },
});

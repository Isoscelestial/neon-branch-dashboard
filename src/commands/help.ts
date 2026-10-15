import { createCommand } from '@/lib/cli/commands';

const helpMessage = `Available commands for Neon Branch Dashboard CLI:
  help, h    # Shows this help message
  get, g       [branchName]    # Gets connection string for an existing branch
  dev, d       [githubUsername]    # Gets connection string for a developer's branch given their username. If missing, creates a branch
  exit,
  quit, q    # End session`;

export const HelpCMD = createCommand({
  command: ['help', 'h'],
  function() {
    console.log(helpMessage);
  },
});

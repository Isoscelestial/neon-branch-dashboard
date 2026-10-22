import { createCommand } from '@/lib/cli/commands';
import confirmation from '@/lib/cli/confirmation';
import {
  checkIfDumpExists,
  dumpDatabase,
  restoreDatabase,
} from '@/lib/sdk/postgresCLI';
import getConnectionString from '@/lib/utils/getConnectionString';
import {
  envProjectProdDatabaseURL,
  getNeonProjectId,
  getProjectProdDatabaseURL,
} from '@/lib/utils/projects';
import redactSensitiveData, {
  promptRedactSensitiveData,
} from '@/lib/utils/redactSensitiveData';

export const ProdCMD = createCommand({
  command: ['prod', 'p'],
  description:
    'Utilities for dumping the production database, redacting it, and restoring it to a specific development database branch',
  help: 'Usage:\n  prod dump <project>\n  prod transfer <project> <targetBranchName>\n  prod redact <project> <branchName>',
  async function(action, project, branchName) {
    if (!action) {
      console.log('action is required');
      return;
    }
    if (!project) {
      console.log('project is required');
      return;
    }

    const projectId = getNeonProjectId(project);

    switch (action) {
      case 'dump': {
        const PRODUCTION_DATABASE_URL = getProjectProdDatabaseURL(project);
        if (!PRODUCTION_DATABASE_URL) {
          console.log(
            `Cannot dump ${project} production database. Missing environment variable: ${envProjectProdDatabaseURL(project)}`,
          );
          return;
        }
        if (!(await confirmation(`Dump production database to file?`))) {
          console.log("Won't dump production database");
          return;
        }
        if (await checkIfDumpExists()) {
          if (!(await confirmation(`Dump exists already. Overwrite file?`))) {
            console.log('Cancelled database dump');
            return;
          }
        }
        await dumpDatabase(PRODUCTION_DATABASE_URL);
        break;
      }
      case 'transfer': {
        if (!branchName) {
          console.error('Target branch name is required');
          return;
        }

        console.log('\n→ Fetching target branch connection string...');
        const TARGET_DB_URL = await getConnectionString(projectId, branchName);
        const TARGET_DB_URL_UNPOOLED = await getConnectionString(
          projectId,
          branchName,
          false,
        );
        if (!TARGET_DB_URL || !TARGET_DB_URL_UNPOOLED) return;

        if (
          !(await confirmation(
            `Just to verify, here's the connection URL for the target branch ${branchName}: \n${TARGET_DB_URL_UNPOOLED} \nDoes this look correct?`,
          ))
        ) {
          console.log('Cancelled transfer');
          return;
        }

        console.log('\n→ Checking if dump file exists...');
        const dumpExists = await checkIfDumpExists();
        const PRODUCTION_DATABASE_URL = getProjectProdDatabaseURL(project);

        if (dumpExists) {
          if (await confirmation(`Dump exists already. Copy from file?`)) {
            console.log('Will copy from dump file');
          }
        } else {
          if (!PRODUCTION_DATABASE_URL) {
            console.log(
              `Cannot dump ${project} production database. Missing environment variable: ${envProjectProdDatabaseURL(project)}`,
            );
            return;
          } else {
            if (
              !(await confirmation(
                `Need to dump production database first. Dump to file?`,
              ))
            ) {
              console.log("Won't dump production database");
              return;
            }

            console.log('→ Dumping production database...');
            await dumpDatabase(PRODUCTION_DATABASE_URL);
          }
        }

        const redactDatabase = await confirmation(
          "\nWould you like to automatically redact the data of sensitive information once it's been copied over using the default redaction scopes?",
        );

        if (
          !(await confirmation(
            `\nCopy data to the "${branchName}" database branch? \nWARNING: This will completely overwrite any existing data!`,
          ))
        ) {
          console.log("Won't copy data");
          return;
        }

        console.log(`\n→ Copying data to ${branchName}...`);
        await restoreDatabase(TARGET_DB_URL_UNPOOLED);

        if (redactDatabase) {
          console.log(`\n→ Redacting data in ${branchName}...`);
          await redactSensitiveData(TARGET_DB_URL);
        }

        console.log(
          `\nFinished! You should manually check the database for issues. Here's the connection string again: \n${TARGET_DB_URL}`,
        );
        break;
      }
      case 'redact': {
        if (!branchName) {
          console.error('Target branch name is required');
          return;
        }

        console.log('\n→ Fetching target branch connection string...');
        const TARGET_DB_URL = await getConnectionString(projectId, branchName);
        if (!TARGET_DB_URL) return;

        if (
          !(await confirmation(
            `Just to verify, here's the connection URL for the target branch ${branchName}: \n${TARGET_DB_URL} \nDoes this look correct?`,
          ))
        ) {
          console.log('Cancelled transfer');
          return;
        }

        const redactDatabase = await confirmation(
          `\nWould you like to automatically redact the data of sensitive information in ${branchName}? \nWARNING: Data will be deleted. This cannot be undone!`,
        );
        if (!redactDatabase) {
          console.log("Won't redact database");
          return;
        }

        console.log(`\n→ Redacting data in ${branchName}...`);
        await promptRedactSensitiveData(TARGET_DB_URL);

        console.log(
          `\nFinished redacting ${branchName}! You should manually check the database for issues. Here's the connection string again: \n${TARGET_DB_URL}`,
        );

        break;
      }
      default:
        console.error(
          `Invalid action: ${action}. Valid actions: dump, transfer, redact`,
        );
        break;
    }
  },
});

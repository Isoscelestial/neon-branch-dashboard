import env, { hasEnvVar, requireEnvVar } from '@/env';
import { createCommand } from '@/lib/cli/commands';
import confirmation from '@/lib/cli/confirmation';
import {
  checkIfDumpExists,
  dumpDatabase,
  restoreDatabase,
} from '@/lib/sdk/postgresCLI';
import getConnectionString from '@/lib/utils/getConnectionString';
import redactSensitiveData, {
  promptRedactSensitiveData,
} from '@/lib/utils/redactSensitiveData';

export const ProdCMD = createCommand({
  command: ['prod', 'p'],
  async function(action: 'dump' | 'transfer' | 'redact', branchName?: string) {
    switch (action) {
      case 'dump': {
        requireEnvVar('PRODUCTION_DATABASE_URL');

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
        await dumpDatabase(env.PRODUCTION_DATABASE_URL!);
        break;
      }
      case 'transfer': {
        if (!branchName) {
          console.error('Target branch name is required');
          return;
        }

        console.log();

        console.log('→ Fetching target branch connection string...');
        const TARGET_DB_URL = await getConnectionString(branchName);
        if (!TARGET_DB_URL) return;

        if (
          !(await confirmation(
            `Just to verify, here's the connection URL for the target branch ${branchName}: \n${TARGET_DB_URL} \nDoes this look correct?`,
          ))
        ) {
          console.log('Cancelled transfer');
          return;
        }

        console.log();

        console.log('→ Checking if dump file exists...');
        const dumpExists = await checkIfDumpExists();
        if (dumpExists) {
          if (await confirmation(`Dump exists already. Copy from file?`)) {
            console.log('Will copy from dump file');
          } else {
            if (!hasEnvVar('PRODUCTION_DATABASE_URL')) {
              console.log(
                'Cannot dump production database. Missing environment variable: PRODUCTION_DATABASE_URL',
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
              await dumpDatabase(env.PRODUCTION_DATABASE_URL!);
            }
          }
        }

        console.log();

        const redactDatabase = await confirmation(
          "Would you like to automatically redact the data of sensitive information once it's been copied over using the default redaction scopes?",
        );

        if (
          !(await confirmation(
            `Copy data to the "${branchName}" database branch? \nWARNING: This will completely overwrite any existing data!`,
          ))
        ) {
          console.log("Won't copy data");
          return;
        }

        console.log(`→ Copying data to ${branchName}...`);
        await restoreDatabase(TARGET_DB_URL);

        console.log();

        if (redactDatabase) {
          console.log(`→ Redacting data in ${branchName}...`);
          await redactSensitiveData(TARGET_DB_URL);

          console.log();
        }

        console.log(
          `Finished! You should manually check the database for issues. Here's the connection string again: \n${TARGET_DB_URL}`,
        );
        break;
      }
      case 'redact': {
        if (!branchName) {
          console.error('Target branch name is required');
          return;
        }

        console.log('\n→ Fetching target branch connection string...');
        const TARGET_DB_URL = await getConnectionString(branchName);
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

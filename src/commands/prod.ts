import { createCommand } from '@/lib/cli/commands';
import confirmation from '@/lib/cli/confirmation';
import {
  checkIfDumpExists,
  dumpDatabase,
  restoreDatabase,
} from '@/lib/sdk/postgresCLI';

const PROD_DB_URL = process.env.SOURCE_DB_URL!;
const TARGET_DB_URL = process.env.TARGET_DB_URL!;

export const ProdCMD = createCommand({
  command: ['prod', 'p'],
  async function(action: 'dump' | 'transfer') {
    switch (action) {
      case 'dump':
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
        await dumpDatabase(PROD_DB_URL);
        break;
      case 'transfer':
        const dumpExists = await checkIfDumpExists();
        if (dumpExists) {
          if (await confirmation(`Dump exists already. Transfer from file?`)) {
            console.log('Transferring from dump');
          } else {
            console.log('Dumping production database first');
            await dumpDatabase(PROD_DB_URL);
          }
        }
        await restoreDatabase(TARGET_DB_URL);
        break;
      default:
        console.error(
          `Invalid action: ${action}. Valid actions: dump, transfer`,
        );
        break;
    }
  },
});

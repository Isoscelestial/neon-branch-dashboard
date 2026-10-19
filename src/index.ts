import rl from '@/lib/cli/readline';

import { initializeEnvironment } from './env';
initializeEnvironment();

// Initialize environment before commands
const commands = (await import('@/lib/cli/commands')).default;

async function exit() {
  console.log('\n Ending session');
  rl.close();
  process.exit(0);
}

process.on('SIGINT', exit);
rl.on('SIGINT', exit);

async function main() {
  console.log('Neon Branch Dashboard CLI');

  try {
    mainLoop: while (true) {
      const input = await rl.question('> ');
      const argv = Array.from(
        input.matchAll(/'([^']*)'|"([^"]*)"|(\S+)/g),
        (match) => match[1] ?? match[2] ?? match[3],
      );

      const command = argv[0].toLowerCase();

      if (['exit', 'quit', 'q'].includes(command)) {
        await exit();
        break mainLoop;
      }

      const key = commands
        .keys()
        .find((k) =>
          typeof k === 'string' ? k === command : k.includes(command),
        );

      if (key) {
        const commandFn = commands.get(key);

        if (commandFn) {
          try {
            argv.shift();
            await commandFn(...argv);
          } catch (e) {
            console.error(
              `An error occurred while running command "${command}" -`,
              e,
            );
          }
        } else {
          console.log(`Unable to execute function for command "${command}"`);
        }
      } else {
        console.log(`Unknown command "${command}"`);
      }
    }
  } finally {
    rl.close();
  }
}

main();

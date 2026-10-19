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

      if (['help', 'h'].includes(command)) {
        if (!argv[1]) {
          console.log('\nAvailable commands for Neon Branch Dashboard CLI:');
          console.log(` ${'help, h'.padEnd(20, ' ')} Shows this help message`);
          console.log(` ${'exit, quit, q'.padEnd(20, ' ')} End session`);
          console.log();
          for (const [key, value] of commands) {
            const keyArr = typeof key === 'string' ? key : key.join(', ');
            console.log(` ${keyArr.padEnd(20, ' ')} ${value.description}`);
          }
        } else {
          const commandStr = argv[1].toLowerCase();
          const key = commands
            .keys()
            .find((k) =>
              typeof k === 'string' ? k === commandStr : k.includes(commandStr),
            );

          if (!key) {
            console.log(`Unknown command "${argv[1]}"`);
          } else {
            const command = commands.get(key);
            const keyArr = typeof key === 'string' ? key : key.join(', ');
            console.log(`${keyArr}    ${command?.description}`);
            console.log(command?.help);
          }
        }
        continue;
      }

      const key = commands
        .keys()
        .find((k) =>
          typeof k === 'string' ? k === command : k.includes(command),
        );

      if (key) {
        const commandFn = commands.get(key)?.function;

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

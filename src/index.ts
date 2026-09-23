import { createInterface } from 'node:readline/promises';
import commands from '@/commands';

async function main() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

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
        console.log('Ending session');
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
          commandFn(...argv);
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

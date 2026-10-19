import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

console.log('→ Initializing commands');

const commandsDir = path.resolve('src', 'commands');

type CommandOptions = {
  command: string | string[];
  function: (...args: any[]) => any;
  helpMessage?: string;
};

const commands = new Map<
  CommandOptions['command'],
  Omit<CommandOptions, 'command'>
>();

export function createCommand({ command, ...rest }: CommandOptions) {
  commands.set(command, { ...rest });
}

async function registerCommands() {
  if (!fs.existsSync(commandsDir)) return;

  const files = fs.readdirSync(commandsDir);

  for (const file of files) {
    if (
      file.startsWith('index') ||
      file.endsWith('.d.ts') ||
      file.endsWith('.map')
    ) {
      continue;
    }

    const fullPath = path.join(commandsDir, file);

    if (fs.statSync(fullPath).isFile()) {
      const fileURL = pathToFileURL(fullPath).href;

      const moduleExports = await import(fileURL);

      Object.keys(moduleExports).forEach((exportName) => {
        const exportedItem = moduleExports[exportName];

        if (typeof exportedItem === 'function') {
          console.log(`Registering ${exportName} from ${file}`);
          exportedItem();
        }
      });
    }
  }
}

registerCommands();

export default commands;

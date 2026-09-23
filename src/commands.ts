const commands = new Map<string | string[], (...args: any[]) => any>();

const helpMessage = `Available commands for Neon Branch Dashboard CLI:
  help, h - Shows this help message
  exit, quit, q - End session`;

commands.set(['help', 'h'], () => {
  console.log(helpMessage);
});

export default commands;

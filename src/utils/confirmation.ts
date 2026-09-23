/** Yes/no confirmation for terminal */
export default function confirmation(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write(`${question} (y/n) `);

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.once('data', (key) => {
      if (key.toString() === '\u0003') {
        process.exit();
      }

      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');

      if (key.toString().toLowerCase().trim() === 'y') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

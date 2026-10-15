import readline from 'readline';
import rl from './readline';

/** Yes/no confirmation for terminal */

// // Bugged, entering N puts N at the end of the next response. Can't figure it out soooo
// export default function confirmation(question: string): Promise<boolean> {
//   return new Promise((resolve) => {
//     process.stdout.write(`${question} (y/n) `);

//     process.stdin.setRawMode(true);
//     process.stdin.resume();
//     process.stdin.setEncoding('utf8');

//     process.stdin.once('data', (key) => {
//       if (key.toString() === '\u0003') {
//         process.exit();
//       }

//       process.stdin.setRawMode(false);
//       process.stdin.pause();
//       process.stdout.write('\n');
//       readline.clearLine(process.stdout, 0);

//       if (key.toString().toLowerCase().trim() === 'y') {
//         resolve(true);
//       } else {
//         resolve(false);
//       }
//     });
//   });
// }

export default function confirmation(question: string): Promise<boolean> {
  return new Promise(async (resolve) => {
    const answer = await rl.question(`${question} (y/n) `);
    if (answer.toLowerCase().trim() === 'y') {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

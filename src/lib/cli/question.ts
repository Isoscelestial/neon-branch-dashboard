import rl from './readline';

export default function question(question: string): Promise<string> {
  return new Promise(async (resolve) => {
    const answer = await rl.question(`${question} `);
    resolve(answer.trim());
  });
}

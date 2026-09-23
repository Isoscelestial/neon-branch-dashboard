const commands = new Map<string | string[], (...args: any[]) => any>();

const helpMessage = `Available commands for Neon Branch Dashboard CLI:
  help, h - Shows this help message
  get, g - Gets a new branch
  exit, quit, q - End session`;

commands.set(['help', 'h'], () => {
  console.log(helpMessage);
});

commands.set(['get', 'g'], async (githubUsername: string) => {
  const DATABASE_NAME = 'neondb';
  const ROLE_NAME = 'neondb_owner';

  const params = new URLSearchParams({
    database_name: DATABASE_NAME,
    role_name: ROLE_NAME,
  });

  const res = await fetch(
    `${process.env.NEON_API_URL}/projects/${process.env.NEON_PROJECT_ID}/connection_uri?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.NEON_API_KEY}`,
      },
    },
  );

  const data = await res.json();

  console.log('data', data);
});

export default commands;

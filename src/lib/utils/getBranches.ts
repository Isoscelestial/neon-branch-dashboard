import env, { requireEnvVar } from '@/env';
import { Branch } from '@neon/sdk';

export default async function getBranches(): Promise<Branch[]> {
  requireEnvVar('NEON_API_URL');
  requireEnvVar('NEON_PROJECT_ID');
  requireEnvVar('NEON_API_KEY');

  // // It appears there's a bug with the Neon Management SDK. The following should work but it crashes, hence why we're manually fetching from the Neon API
  // const { all } = neon.branches.list({ projectId });
  // const { data: branches } = await all();

  const params = new URLSearchParams({
    project_id: env.NEON_PROJECT_ID,
  });

  const res = await fetch(
    `${env.NEON_API_URL}/projects/${env.NEON_PROJECT_ID}/branches?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${env.NEON_API_KEY}`,
      },
    },
  );

  const data = await res.json();

  return data.branches as Branch[];
}

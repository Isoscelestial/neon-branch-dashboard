import env, { requireEnvVar } from '@/env';
import { Branch } from '@neon/sdk';

export default async function getBranches(
  projectId: string,
): Promise<Branch[]> {
  const NEON_API_URL = requireEnvVar('NEON_API_URL');
  const NEON_API_KEY = requireEnvVar('NEON_API_KEY');

  // // It appears there's a bug with the Neon Management SDK. The following should work but it crashes, hence why we're manually fetching from the Neon API
  // const { all } = neon.branches.list({ projectId });
  // const { data: branches } = await all();

  const params = new URLSearchParams({
    project_id: projectId,
  });

  const res = await fetch(
    `${NEON_API_URL}/projects/${projectId}/branches?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${NEON_API_KEY}`,
      },
    },
  );

  const data = await res.json();

  return data.branches as Branch[];
}

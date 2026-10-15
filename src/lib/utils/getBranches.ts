import { Branch } from '@neon/sdk';

const project_id = process.env.NEON_PROJECT_ID!;

export default async function getBranches(): Promise<Branch[]> {
  // // It appears there's a bug with the Neon Management SDK. The following should work but it crashes, hence why we're manually fetching from the Neon API
  // const { all } = neon.branches.list({ projectId });
  // const { data: branches } = await all();

  const params = new URLSearchParams({
    project_id,
  });

  const res = await fetch(
    `${process.env.NEON_API_URL}/projects/${process.env.NEON_PROJECT_ID}/branches?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.NEON_API_KEY}`,
      },
    },
  );

  const data = await res.json();

  return data.branches as Branch[];
}

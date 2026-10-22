export type Project = {
  label: string;
  value: string;
  description: string;
  neonProjectId: string;
};

export const PROJECTS = [
  {
    label: 'Clubs',
    value: 'clubs',
    description: 'A database branch for Clubs',
    neonProjectId: process.env.CLUBS_NEON_PROJECT_ID!,
  },
  {
    label: 'Notebook',
    value: 'notebook',
    description: 'A database branch for Notebook',
    neonProjectId: process.env.NOTEBOOK_NEON_PROJECT_ID!,
  },
] as const satisfies Project[];

export type ProjectValue = (typeof PROJECTS)[number]['value'];

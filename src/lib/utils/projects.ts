export type Project = {
  label: string;
  value: string;
  description: string;
  neonProjectId: string;
  productionDatabaseURL?: string;
};

export const PROJECTS = [
  {
    label: 'Clubs',
    value: 'clubs',
    description: 'A database branch for Clubs',
    neonProjectId: process.env.CLUBS_NEON_PROJECT_ID!,
    productionDatabaseURL: process.env.CLUBS_PRODUCTION_DATABASE_URL,
  },
  {
    label: 'Notebook',
    value: 'notebook',
    description: 'A database branch for Notebook',
    neonProjectId: process.env.NOTEBOOK_NEON_PROJECT_ID!,
    productionDatabaseURL: process.env.NOTEBOOK_PRODUCTION_DATABASE_URL,
  },
] as const satisfies Project[];

export type ProjectValue = (typeof PROJECTS)[number]['value'];

export function getNeonProjectId(project: string): string {
  if (!project) throw new Error('Project name required');
  const foundProject = PROJECTS.find((p) => p.value === project);
  if (!foundProject)
    throw new Error(
      `Could not find project "${project}". Valid projects: ${PROJECTS.map((p) => p.value).join(', ')}`,
    );
  return foundProject.neonProjectId;
}

export function getProjectProdDatabaseURL(project: string): string | undefined {
  if (!project) throw new Error('Project name required');
  const foundProject = PROJECTS.find((p) => p.value === project);
  if (!foundProject)
    throw new Error(
      `Could not find project "${project}". Valid projects: ${PROJECTS.map((p) => p.value).join(', ')}`,
    );
  return foundProject.productionDatabaseURL;
}

export function envNeonProjectId(project: string): string {
  return `${project.toUpperCase()}_NEON_PROJECT_ID`;
}

export function envProjectProdDatabaseURL(project: string): string {
  return `${project.toUpperCase()}_PRODUCTION_DATABASE_URL`;
}

import z from 'zod';
import {
  envNeonProjectId,
  envProjectProdDatabaseURL,
  PROJECTS,
} from '@/lib/utils/projects';

const neonProjectsSchema = PROJECTS.reduce<Record<string, z.ZodType>>(
  (accumulator, current) => {
    accumulator[envNeonProjectId(current.value)] = z.string({
      error: `Missing project ID for ${current.label}`,
    });
    accumulator[envProjectProdDatabaseURL(current.value)] = z
      .string({
        error: `Production database URL for ${current.label} should be an unpooled database URL`,
      })
      .optional();

    return accumulator;
  },
  {},
);

const envSchema = z.object({
  NEON_API_URL: z.string().default('https://console.neon.tech/api/v2'),
  NEON_API_KEY: z.string({
    error:
      'Missing API key! Ensure this key is scoped to include the project ID',
  }),
  GITHUB_TOKEN: z
    .string({
      error:
        'Missing GitHub Personal Access Token! Must have permissions to read organization members',
    })
    .optional(),
  GITHUB_ORG: z.string().optional(),
  GITHUB_TEAM_SLUG: z.string().optional(),
  ...neonProjectsSchema,
});

type EnvSchema = z.infer<typeof envSchema>;

const env: EnvSchema = {} as EnvSchema;

/**
 * Run once to initialize {@linkcode env}. Also validates environment varisbles and kills the program if environment
 * variables don't match the schema defined by {@linkcode envSchema}
 */
export function initializeEnvironment() {
  console.log('→ Initializing environment variables...');

  const parsed = envSchema.safeParse(process.env);

  if (parsed.success) {
    Object.assign(env, parsed.data);
  } else {
    const errors = z.treeifyError(parsed.error).properties ?? [];

    let errorString = '';
    for (const [key, value] of Object.entries(errors)) {
      errorString += `\n • ${key} - ${value.errors.join('; ')}`;
    }

    console.error('\n❌ Invalid environment variables:', errorString);
    process.exit(1);
  }
}

/**
 * Whether a specific environment variable is in the environment, since some variables may be missing due to being
 * optional.
 */
export function hasEnvVar(envVarKey: keyof EnvSchema): boolean {
  return envVarKey in env;
}

/**
 * Requires a specific environment variable to be defined, since some variables may be missing due to being optional.
 * Throws an error if it is missing.
 */
export function requireEnvVar(envVarKey: keyof EnvSchema) {
  if (!(envVarKey in env))
    throw new Error(
      `This requires an environment variable that is missing: ${envVarKey}`,
    );
  return env[envVarKey];
}

export default env;

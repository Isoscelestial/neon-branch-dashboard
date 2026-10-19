import z from 'zod';

const envSchema = z.object({
  NEON_API_URL: z.string().default('https://console.neon.tech/api/v2'),
  NEON_API_KEY: z.string({
    error:
      'Missing API key! Ensure this key is scoped to include the project ID',
  }),
  NEON_PROJECT_ID: z.string({
    error:
      'Missing project ID! Corresponds to the Neon project for development database branches',
  }),
  GITHUB_TOKEN: z
    .string({
      error:
        'Missing GitHub Personal Access Token! Must have permissions to read organization members',
    })
    .optional(),
  PRODUCTION_DATABASE_URL: z
    .string({ error: 'Should be an unpooled database URL' })
    .optional(),
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
}

export default env;

import { neon } from '@neondatabase/serverless';
import confirmation from '@/lib/cli/confirmation';

/**
 * Specifies what additional data is redacted. Login information is always redacted.
 *
 * - `aiCache` - Redacts AI cache
 * - `userMetadata` - Redacts specific user metadata: college info, contact email
 * - `userMetadataAll` - Same as `userMetadata`, except it cascades truncation which means related data is also deleted
 *   (e.g. clubs joined, events joined, admins, etc.)
 * - `user` - Redacts specific identifying user data: names (including from user_metadata), email (will set to random
 *   example.com email address), profile image
 * - `userAll` - Same as `user`, except it cascades truncation which means related data is also deleted (e.g. associated
 *   accounts, clubs utilizing user webhooks)
 */
type RedactionScope =
  'aiCache' | 'userMetadata' | 'userMetadataAll' | 'user' | 'userAll';

const defaultScopes: Record<RedactionScope, boolean> = {
  aiCache: true,
  userMetadata: true,
  userMetadataAll: false,
  user: false,
  userAll: false,
};

/** Wrapper function for {@linkcode redactSensitiveData} that prompts the user to customize scopes. */
export async function promptRedactSensitiveData(databaseURL: string) {
  const useDefaultScopes = await confirmation('Use default redaction scopes?');

  if (!useDefaultScopes) {
    let currentScope = 1;
    const numScopes = Object.keys(defaultScopes).length;

    const scopes = { ...defaultScopes };

    for (const key in defaultScopes) {
      const scope = key as RedactionScope;

      scopes[scope] = await confirmation(
        `(${currentScope}/${numScopes}) Redact ${scope}? Default: ${defaultScopes[scope] ? 'y' : 'n'}`,
      );

      currentScope++;
    }

    return redactSensitiveData(databaseURL, scopes);
  } else {
    return redactSensitiveData(databaseURL);
  }
}

/** Deletes sensitive data from {@linkcode databaseURL}. Use {@linkcode scopes} to customize what data is deleted. */
export default async function redactSensitiveData(
  databaseURL: string,
  scopes?: Record<RedactionScope, boolean>,
) {
  scopes = { ...defaultScopes, ...scopes };

  const sql = neon(databaseURL);

  // Required redactions

  console.log(`→ Redacting BetterAuth login information...`);
  // BetterAuth - see https://better-auth.com/docs/concepts/database#core-schema
  await sql`TRUNCATE TABLE account`;
  await sql`TRUNCATE TABLE session`;
  await sql`TRUNCATE TABLE verification`;
  // // If we enable these in the future
  // await sql`TRUNCATE TABLE twoFactor`;
  // await sql`TRUNCATE TABLE passkey`;
  // await sql`TRUNCATE TABLE walletAddress`;

  // Optionanl redactions

  if (scopes.aiCache) {
    console.log(`→ Redacting AI cache...`);
    await sql`TRUNCATE TABLE user_ai_cache`;
  }

  if (scopes.userMetadataAll) {
    console.log(`→ Redacting all user metadata...`);
    await sql`TRUNCATE TABLE user_metadata CASCADE`;
  } else if (scopes.userMetadata) {
    console.log(`→ Redacting user metadata...`);
    await sql`UPDATE user_metadata SET major = '', minor = NULL, graduation_date = NULL, contact_email = NULL, student_classification = 'Student'`;
  }

  if (scopes.userAll) {
    console.log(`→ Redacting all user data...`);
    await sql`TRUNCATE TABLE "user", account CASCADE`;
  } else if (scopes.user) {
    console.log(`→ Redacting user data...`);
    await sql`UPDATE "user" SET name = '', email = gen_random_uuid() || '@example.com', image = ''`;
    await sql`UPDATE user_metadata SET first_name = '', last_name = ''`;
  }
}

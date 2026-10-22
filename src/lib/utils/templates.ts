/** Matches a valid GitHub username */
export const GitHubUsernameRegex =
  /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

/**
 * Constructs the branch name belonging to a particular GitHub username
 *
 * @param githubUsername The person this branch belongs to
 * @param index A positive integer that selects a branch per person. If 0, omits the index suffix (i.e. uses legacy
 *   branch name system)
 * @param note A string to append to the end of the branch name
 * @returns
 */
export function dev(
  githubUsername: string,
  index?: number,
  note?: string,
): string {
  if (index && (!Number.isInteger(index) || index < 0)) {
    throw new Error('Invalid index for branch name');
  }

  // Legacy branch name
  if (index === 0) return `dev/${githubUsername}`;

  return `dev/${githubUsername}#${index}${note ? ` ${note}` : ''}`;
}

/** Constructs a branch name based off a GitHub branch. */
export function preview(gitBranch: string): string {
  return `preview/${gitBranch}`;
}

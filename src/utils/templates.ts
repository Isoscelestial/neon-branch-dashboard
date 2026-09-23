/**
 * Constructs a branch name based off someone's GitHub username. Can be used as either a function or tagged template
 * literal
 */
export function dev(githubUsername: string): string;
export function dev(strings: TemplateStringsArray, ...values: string[]): string;
export function dev(
  strings: string | TemplateStringsArray,
  ...values: string[]
): string {
  const username =
    typeof strings === 'string'
      ? // Used as a function (probably)
        strings
      : // Used as a tagged template literal (probably)
        strings.reduce((result, str, i) => {
          const value = values[i] !== undefined ? `${values[i]}` : '';
          return result + str + value;
        }, '');

  return `dev/${username}`;
}

/** Constructs a branch name based off a GitHub branch. Can be used as either a function or tagged template literal */
export function preview(gitBranch: string): string;
export function preview(
  strings: TemplateStringsArray,
  ...values: string[]
): string;
export function preview(
  strings: string | TemplateStringsArray,
  ...values: string[]
): string {
  const gitBranch =
    typeof strings === 'string'
      ? // Used as a function (probably)
        strings
      : // Used as a tagged template literal (probably)
        strings.reduce((result, str, i) => {
          const value = values[i] !== undefined ? `${values[i]}` : '';
          return result + str + value;
        }, '');

  return `preview/${gitBranch}`;
}

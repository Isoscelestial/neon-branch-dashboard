# Neon Branch Dashboard

Interacts with the Neon API using the Neon Management SDK:

- Neon API - [Documentation](https://neon.com/docs/reference/api)
- Neon Management SDK - [Documentation](https://neon.com/docs/reference/typescript-sdk)

Also interacts with the GitHub API using octokit.js:

- octokit.js - [Documentation](https://github.com/octokit/octokit.js)

## Environment Variables

- `NEON_API_URL` - URL for calling Neon API raw
- `NEON_API_KEY` - Neon API key
- `NEON_PROJECT_ID` - ID of Neon project to create database branches in
- `GITHUB_TOKEN` - GitHub Personal Access Token. Must have permissions to read organization members

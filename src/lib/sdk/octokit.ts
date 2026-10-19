import env from '@/env';
import { Octokit } from 'octokit';

const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

export default octokit;

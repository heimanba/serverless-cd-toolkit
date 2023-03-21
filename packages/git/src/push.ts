import simpleGit, { SimpleGit } from 'simple-git';
import retry from 'async-retry';

import { ensureDir } from './utils';
const debug = require('@serverless-cd/debug')('serverless-cd:git_git-push');

export interface IPush {
  execDir: string;
  branch?: string;
}

export default async function push(config: IPush, baseGit?: SimpleGit) {
  const { branch } = config;
  const git = baseGit || simpleGit(ensureDir(config.execDir));
  await retry(
    async () => {
      // @ts-ignore
      await git.push(['-f', '-u', 'origin', branch]);
    },
    {
      retries: 3,
    },
  );
}

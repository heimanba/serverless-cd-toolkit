import { fs } from '@serverless-cd/core';

import * as path from 'path';
import * as os from 'os';
const debug = require('@serverless-cd/debug')('serverless-cd:git_util');

export const ensureDir = (dir: string) => {
  const myDir = dir || os.tmpdir();
  const realDir: string = path.isAbsolute(myDir) ? myDir : path.join(process.cwd(), myDir);
  debug(`execDir: ${realDir}`);
  fs.ensureDirSync(realDir);
  return realDir;
};

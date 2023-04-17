import Engine, { IStepOptions, IContext } from '../src';
import { SERVERLESS_CD_KEY, SERVERLESS_CD_VALUE } from '../src/constants';
import { lodash } from '@serverless-cd/core';
import * as path from 'path';
const { get, find } = lodash;
const logPrefix = path.join(__dirname, 'logs');

test('模版可以识别 ${{env.name}}', async () => {
  const steps = [
    { run: 'echo ${{env.name}}', env: { name: 'xiaoming' } },
  ] as unknown as IStepOptions[];
  const engine = new Engine({ steps, logConfig: { logPrefix } });
  const res = await engine.start();
  expect(get(res, 'status')).toBe('success');
});

test('模版可以识别 ${{steps.xuse.outputs.success}}', async () => {
  const steps = [
    { plugin: path.join(__dirname, 'fixtures', 'app'), id: 'xuse', inputs: { milliseconds: 10 } },
    { run: 'echo ${{steps.xuse.outputs.success}}' },
  ] as IStepOptions[];
  const engine = new Engine({ steps, logConfig: { logPrefix } });
  const res: IContext | undefined = await engine.start();
  const data = find(res?.steps, (item) => item.stepCount === res?.stepCount);
  expect(data?.outputs).toEqual({ success: true });
});

test('shell 指令支持多个指令执行 && ', async () => {
  const steps = [{ run: 'echo aa && echo bb' }] as unknown as IStepOptions[];
  const engine = new Engine({ steps, logConfig: { logPrefix } });
  const res = await engine.start();
  expect(get(res, 'status')).toBe('success');
});

test('shell 指令支持多个指令执行 >  ', async () => {
  const steps = [{ run: `echo aa > ${logPrefix}/pipe.txt` }] as unknown as IStepOptions[];
  const engine = new Engine({ steps, logConfig: { logPrefix } });
  const res = await engine.start();
  expect(get(res, 'status')).toBe('success');
});

test('环境变量测试', async () => {
  const steps = [{ run: `echo hello` }];
  const engine = new Engine({ steps, logConfig: { logPrefix } });
  const res = await engine.start();
  expect(process.env[SERVERLESS_CD_KEY]).toBe(SERVERLESS_CD_VALUE);
});

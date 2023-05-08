import git from '../src';
import _ from 'lodash';
import Gitee from '../src/providers/gitee';

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const access_token: string = process.env.GITEE_ACCESS_TOKEN || '';
const OWNER = 'hazel928';
const REPO = 'test1234';

test('list repo', async () => {
  const provider = git('gitee', { access_token });
  const rows = await provider.listRepos();

  expect(_.isArray(rows)).toBeTruthy();
  for (const row of rows) {
    expect(_.has(row, 'id')).toBeTruthy();
    expect(_.isString(row.name)).toBeTruthy();
    expect(_.isString(row.url) && _.endsWith(row.url, '.git')).toBeTruthy();
    expect(_.has(row, 'source')).toBeTruthy();
  }
});

test.only('list branches', async () => {
  const provider = git('gitee', { access_token });
  const rows = await provider.listBranches({ owner: OWNER, repo: REPO });

  expect(_.isArray(rows)).toBeTruthy();

  for (const row of rows) {
    expect(_.isString(row.name)).toBeTruthy();
    expect(_.isString(row.commit_sha)).toBeTruthy();
    expect(_.has(row, 'source')).toBeTruthy();
  }
});

test('get user', async () => {
  const provider = git('gitee', { access_token });
  const result = await provider.user();
  console.log('result: ', result);
  expect(_.isString(result.login)).toBeTruthy();
});

test('get commit by id', async () => {
  const provider = git('gitee', { access_token });
  const sha = '1816c284614dede42d0e0c7eaace00166adc79f0';
  const config = await provider.getCommitById({
    owner: OWNER,
    repo: REPO,
    sha,
  });

  expect(config.sha).toBe(sha);
  expect(_.isString(config.message)).toBeTruthy();
  expect(_.has(config, 'source')).toBeTruthy();
});

test('get branch commit', async () => {
  const provider = git('gitee', { access_token });
  const config = await provider.getRefCommit({
    owner: OWNER, repo: REPO,
    // ref: 'tes',
    ref: 'refs/heads/tes',
  });

  expect(_.isString(config.sha)).toBeTruthy();
  expect(_.isString(config.message)).toBeTruthy();
  expect(_.has(config, 'source')).toBeTruthy();
});

test('get tag commit', async () => {
  const provider = git('gitee', { access_token });
  const config = await provider.getRefCommit({
    owner: OWNER, repo: REPO,
    ref: 'refs/tags/0.0.1',
  });

  expect(_.isString(config.sha)).toBeTruthy();
  expect(_.isString(config.message)).toBeTruthy();
  expect(_.has(config, 'source')).toBeTruthy();
});

test('webhook', async () => {
  const url = 'http://test.abc';
  const provider = git('gitee', { access_token }) as Gitee;

  console.log('expect list');
  const rows = await provider.listWebhook({ owner: OWNER, repo: REPO });
  console.log(rows);
  expect(_.isArray(rows)).toBeTruthy();
  for (const row of rows) {
    expect(_.isString(row.url)).toBeTruthy();
    expect(_.has(row, 'source')).toBeTruthy();
    expect(_.has(row, 'id')).toBeTruthy();
  }
  console.log('expect list successfully');

  console.log('expect create');
  const createConfig = await provider.createWebhook({
    owner: OWNER, repo: REPO, url,
  });
  expect(_.has(createConfig, 'id')).toBeTruthy();
  expect(_.has(createConfig, 'source')).toBeTruthy();
  expect(_.get(createConfig, 'source.push_events')).toBeTruthy();
  expect(_.get(createConfig, 'source.tag_push_events')).toBeTruthy();
  expect(_.get(createConfig, 'source.tag_push_events')).toBeTruthy();
  console.log('expect create successfully');

  const hook_id: number = _.get(createConfig, 'id');
  await provider.updateWebhook({
    owner: OWNER, repo: REPO,
    url,
    hook_id,
    events: ['release'],
  });
  const updateConfig = await provider.getWebhook({ owner: OWNER, repo: REPO, hook_id });
  expect(updateConfig.id).toBe(hook_id);
  expect(_.has(updateConfig, 'source')).toBeTruthy();
  expect(_.get(updateConfig, 'source.push_events')).toBeFalsy();
  expect(_.get(updateConfig, 'source.tag_push_events')).toBeTruthy();
  console.log('expect update successfully');

  console.log('expect delete');
  await provider.deleteWebhook({ owner: OWNER, repo: REPO, hook_id, });
  await expect(async () => {
    await provider.getWebhook({ owner: OWNER, repo: REPO, hook_id });
  }).rejects.toThrow('Request failed with status code 404');
  console.log('expect delete successfully');
});

test('create fork', async () => {
  const provider = git('gitee', { access_token });
  const createFork = await provider.createFork({ owner: OWNER, repo: REPO });
  console.log(createFork)
  expect(_.has(createFork, 'id')).toBeTruthy();
  expect(_.has(createFork, 'full_name')).toBeTruthy();
  expect(_.has(createFork, 'url')).toBeTruthy();
  console.log('expect create successfully');
});

test('create a  repo', async () => {
  const provider = git('gitee', { access_token });
  const createFork = await provider.createRepo({ name: 'testCreateRepo1' });
  console.log(createFork)
  expect(_.has(createFork, 'id')).toBeTruthy();
  expect(_.has(createFork, 'full_name')).toBeTruthy();
  expect(_.has(createFork, 'url')).toBeTruthy();
  console.log('expect create successfully');
});

test('delete a repo', async () => {
  const provider = git('gitee', { access_token });
  const repo = await provider.hasRepo({ owner: OWNER, repo: REPO });
  console.log(repo);
  expect(_.has(repo, 'id')).toBeTruthy();
  console.log('has repo successfully');

  await provider.deleteRepo({ owner: OWNER, repo: REPO })
  await expect(async () => {
    await provider.hasRepo({ owner: OWNER, repo: REPO });
  }).rejects.toThrow('Request failed with status code 404');
  console.log('expect delete successfully');
});

test('create a protection branch', async () => {
  const provider = git('gitee', { access_token });
  const branch = 'master';
  await provider.setProtectionBranch({
    owner: OWNER,
    repo: REPO,
    branch: branch,
  });
  const res = await provider.getProtectionBranch({
    owner: OWNER,
    repo: REPO,
    branch: branch,
  });
  expect(_.get(res, 'protected')).toBeTruthy();
  console.log('expect set branch protection successfully');
});

test('check a repo whether exists', async () => {
  const provider = git('gitee', { access_token });
  const res = await provider.hasRepo({
    owner: OWNER,
    repo: REPO,
  });
  console.log(res);
  expect(_.has(res, 'isExist')).toBeTruthy();
});

test('check whether a repo is empty', async () => {
  const provider = git('gitee', { access_token });
  const res = await provider.checkRepoEmpty({
    owner: OWNER,
    repo: REPO,
  });
  console.log(res);
});

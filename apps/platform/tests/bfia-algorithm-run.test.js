/* eslint-env jest */
jest.mock('umi-request', () => ({ __esModule: true, default: jest.fn() }));

const send = require('umi-request').default;

const {
  getAlgorithmRunLog,
  getLatestAlgorithmRun,
  isActiveRun,
  startAlgorithmRun,
} = require('../src/modules/bfia-component-list/bfia-algorithm-run.service');

it('does not treat a response without a run as successful submission', async () => {
  const post = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: async () => ({ status: { code: 0 }, data: { canStart: true, run: null } }),
  });
  try {
    await expect(startAlgorithmRun('token')).rejects.toThrow('未返回受理的运行记录');
    expect(post).toHaveBeenCalledWith('/api/v1bfia/algorithm-run/start', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest', 'User-Token': 'token' },
    });
  } finally {
    post.mockRestore();
  }

  const run = {
    runId: 'bfia-public-run-1',
    status: 'QUEUED',
    algorithms: [{ id: 'sgb', status: 'QUEUED', numerical: null, protocol: null }],
  };
  send.mockResolvedValueOnce({ status: { code: 0 }, data: { canStart: true, run } });
  expect(isActiveRun((await getLatestAlgorithmRun()).run)).toBe(true);
  expect(isActiveRun({ ...run, status: 'FAILED' })).toBe(false);
});

it('reads the selected party log from the current run and preserves its content', async () => {
  const content = '[Bob] handshake complete\n[Bob] output written';
  send.mockResolvedValueOnce({ status: { code: 0 }, data: { content } });
  await expect(getAlgorithmRunLog('run-42', 'ss-lr', 'bob')).resolves.toBe(content);
  expect(send).toHaveBeenLastCalledWith('/api/v1bfia/algorithm-run/run-42/log', {
    params: { algorithm: 'ss-lr', party: 'bob' },
  });
});

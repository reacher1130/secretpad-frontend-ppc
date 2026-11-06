/* eslint-env jest */
jest.mock('umi-request', () => ({ __esModule: true, default: jest.fn() }));

const send = require('umi-request').default;

const {
  applyCooperation,
  confirmCooperation,
  listCooperationRequests,
} = require('../src/modules/connectivity/cooperative-node-list/cooperative-node.service');

beforeEach(() => {
  send.mockReset();
});

it('keeps the pending contract rows and total from the BFIA records response', async () => {
  const row = {
    contractId: 'contract-1',
    nodeId: 'alice',
    status: 'UNAPPROVED',
    direction: 'INBOUND',
    canConfirm: true,
  };
  send.mockResolvedValue({
    status: { code: 0 },
    data: { records: [row], total: 11 },
  });

  await expect(listCooperationRequests(2, 10)).resolves.toEqual({
    records: [row],
    total: 11,
  });
  expect(send).toHaveBeenCalledWith('/api/v1bfia/node/list/apply', {
    params: { page_num: 2, page_size: 10 },
  });
});

it('surfaces API and malformed response failures instead of rendering an empty list', async () => {
  send.mockResolvedValueOnce({ status: { code: 500, msg: '对端不可用' } });
  await expect(listCooperationRequests(1, 10)).rejects.toThrow('对端不可用');

  send.mockResolvedValueOnce({ status: { code: 0 }, data: { total: 1 } });
  await expect(listCooperationRequests(1, 10)).rejects.toThrow('列表格式错误');
});

it('requires affirmative approval and only submits a configured peer ID and expiry', async () => {
  send.mockResolvedValueOnce({ status: { code: 0 }, data: false });
  await expect(confirmCooperation('contract-1', 'APPROVED')).rejects.toThrow(
    '合作审批未确认',
  );

  send.mockResolvedValueOnce({ status: { code: 0 }, data: true });
  await expect(applyCooperation('bob', 1900000000)).resolves.toBeUndefined();
  expect(send).toHaveBeenLastCalledWith('/api/v1bfia/node/contract/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { node_id: 'bob', expired_time: 1900000000 },
  });
});

jest.mock('antd', () => ({ message: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/services/secretpad/FateJobController', () => ({ listFateJobs: jest.fn() }));
jest.mock('@/services/secretpad/FateDatasetController', () => ({ listFateDatasets: jest.fn() }));
jest.mock('@/services/secretpad/FateModelController', () => ({ listFateModels: jest.fn() }));
const { FateManagementService } = require('../src/modules/fate-management/fate-management.service');
const { listFateJobs } = require('../src/services/secretpad/FateJobController');
const { listFateDatasets } = require('../src/services/secretpad/FateDatasetController');
const { listFateModels } = require('../src/services/secretpad/FateModelController');
const ok = (data) => ({ status: { code: 0 }, data });
beforeEach(() => jest.clearAllMocks());

test.each([
  ['loadJobs', 'jobs', listFateJobs],
  ['loadDatasets', 'datasets', listFateDatasets],
  ['loadModels', 'models', listFateModels],
])('%s ignores an old cluster response arriving last', async (method, field, api) => {
  const service = new FateManagementService();
  let finishOld;
  api.mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve; }))
    .mockResolvedValueOnce(ok([{ clusterId: 'B' }]));
  service.currentClusterId = 'A';
  const old = service[method]('A');
  service.currentClusterId = 'B';
  await service[method]('B');
  finishOld(ok([{ clusterId: 'A' }]));
  await old;
  expect(service[field]).toEqual([{ clusterId: 'B' }]);
});

test('a late older refresh cannot regress a completed job', async () => {
  const service = new FateManagementService();
  service.currentClusterId = 'A';
  let finishOld;
  listFateJobs.mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve; }))
    .mockResolvedValueOnce(ok([{ status: 'SUCCESS' }]));
  const old = service.loadJobs('A');
  await service.loadJobs('A');
  finishOld(ok([{ status: 'RUNNING' }]));
  await old;
  expect(service.jobs).toEqual([{ status: 'SUCCESS' }]);
});

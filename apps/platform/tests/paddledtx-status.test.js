jest.mock('antd', () => ({ message: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/services/secretpad/PaddleDtxController', () => ({
  getPaddleDtxStatus: jest.fn(),
  submitPaddleDtxTask: jest.fn(),
  getPaddleDtxTask: jest.fn(),
  listPaddleDtxTasks: jest.fn(),
  startPaddleDtxTask: jest.fn(),
}));
const {
  PaddleDtxManagementService,
} = require('../src/modules/paddledtx-management/paddledtx-management.service');
const {
  getPaddleDtxStatus,
  getPaddleDtxTask,
  listPaddleDtxTasks,
  startPaddleDtxTask,
  submitPaddleDtxTask,
} = require('../src/services/secretpad/PaddleDtxController');
beforeEach(() => jest.clearAllMocks());

test('a lost connection clears stale ready state and releases loading', async () => {
  const service = new PaddleDtxManagementService();
  service.status = { ready: true };
  getPaddleDtxStatus.mockRejectedValueOnce(new Error('connection lost'));
  await service.loadStatus();
  expect(service.loading).toBe(false);
  expect(service.status.ready).not.toBe(true);
  expect(service.status.error).toBe('connection lost');
});

test('an unsuccessful status response cannot leave task execution enabled', async () => {
  const service = new PaddleDtxManagementService();
  service.status = { ready: true };
  getPaddleDtxStatus.mockResolvedValueOnce({
    status: { code: 1, msg: 'executor unavailable' },
  });
  await service.loadStatus();
  expect(service.status.ready).not.toBe(true);
  expect(service.status.error).toBe('executor unavailable');
});

test('a published task keeps its ID when automatic start fails', async () => {
  const service = new PaddleDtxManagementService();
  submitPaddleDtxTask.mockResolvedValueOnce({
    status: { code: 0 },
    data: {
      taskId: 'published-id',
      task: { status: 'Ready' },
      error: 'start unavailable',
    },
  });
  expect(await service.submitTask({ name: 'acceptance' })).toBe(true);
  expect(service.selectedTaskId).toBe('published-id');
  expect(service.taskError).toBe('start unavailable');
  expect(submitPaddleDtxTask).toHaveBeenCalledTimes(1);
});

test('a fresh service reloads history from the chain without submitting again', async () => {
  const tasks = [{ taskId: 'existing-id', status: 'Confirming' }];
  listPaddleDtxTasks.mockResolvedValueOnce({ status: { code: 0 }, data: { tasks } });
  const service = new PaddleDtxManagementService();
  await service.loadTasks();
  expect(service.tasks).toEqual(tasks);
  expect(submitPaddleDtxTask).not.toHaveBeenCalled();
  expect(startPaddleDtxTask).not.toHaveBeenCalled();
  listPaddleDtxTasks.mockRejectedValueOnce(new Error('offline'));
  await service.loadTasks();
  expect(service.tasks).toEqual(tasks);
});

test('a late task response cannot overwrite a newer selection', async () => {
  let resolveA;
  getPaddleDtxTask.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveA = resolve;
    }),
  );
  getPaddleDtxTask.mockResolvedValueOnce({
    status: { code: 0 },
    data: { taskId: 'B', task: { status: 'Finished' } },
  });
  const service = new PaddleDtxManagementService();
  const first = service.loadTask('A');
  await service.loadTask('B');
  resolveA({
    status: { code: 0 },
    data: { taskId: 'A', task: { status: 'Confirming' } },
  });
  await first;
  expect(service.selectedTaskId).toBe('B');
  expect(service.lastTask.taskId).toBe('B');
});

test('selecting a task immediately removes the previous ready task while loading', async () => {
  let resolve;
  getPaddleDtxTask.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const service = new PaddleDtxManagementService();
  service.selectedTaskId = 'A';
  service.lastTask = { taskId: 'A', task: { status: 'Ready' } };
  const loading = service.loadTask('B');
  expect(service.selectedTaskId).toBe('B');
  expect(service.lastTask).toBeNull();
  resolve({
    status: { code: 0 },
    data: { taskId: 'B', task: { status: 'Confirming' } },
  });
  await loading;
  expect(service.lastTask.taskId).toBe('B');
});

test('continuing a task uses the same ID and retains it after a request failure', async () => {
  const service = new PaddleDtxManagementService();
  service.selectedTaskId = 'existing-id';
  service.lastTask = { taskId: 'existing-id', task: { status: 'Ready' } };
  startPaddleDtxTask.mockRejectedValueOnce(new Error('offline'));
  await service.startTask('existing-id');
  expect(startPaddleDtxTask).toHaveBeenCalledWith('existing-id');
  expect(service.lastTask.taskId).toBe('existing-id');
  expect(service.taskError).toBe('offline');
  expect(service.starting).toBe(false);
  expect(submitPaddleDtxTask).not.toHaveBeenCalled();
});

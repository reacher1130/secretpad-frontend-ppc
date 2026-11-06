import request from 'umi-request';

export type RunStatus = 'QUEUED' | 'RUNNING' | 'PASSED' | 'FAILED';

export interface AlgorithmCheck {
  id: string;
  status: RunStatus;
  numerical: boolean | null;
  protocol: boolean | null;
}

export interface AlgorithmRun {
  runId: string;
  status: RunStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
  algorithms: AlgorithmCheck[];
  message?: string;
}

export interface AlgorithmRunState {
  canStart: boolean;
  run: AlgorithmRun | null;
}

type Response<T> = { status?: { code?: number; msg?: string }; data?: T };

const root = '/api/v1bfia/algorithm-run';
const runStatuses = new Set<string>(['QUEUED', 'RUNNING', 'PASSED', 'FAILED']);

function readResponse<T>(response: Response<T>, message: string): T {
  if (response?.status?.code !== 0) throw new Error(response?.status?.msg || message);
  if (response.data == null) throw new Error(message);
  return response.data;
}

export function isActiveRun(run?: AlgorithmRun | null) {
  return run?.status === 'QUEUED' || run?.status === 'RUNNING';
}

function readRunState(response: Response<AlgorithmRunState>, message: string) {
  const state = readResponse(response, message);
  const run = state.run ?? null;
  if (
    typeof state.canStart !== 'boolean' ||
    (run !== null &&
      (!run.runId || !runStatuses.has(run.status) || !Array.isArray(run.algorithms)))
  ) {
    throw new Error('BFIA 运行状态返回格式不正确');
  }
  return { ...state, run };
}

export async function getLatestAlgorithmRun() {
  return readRunState(
    await request<Response<AlgorithmRunState>>(`${root}/latest`),
    '无法读取 BFIA 运行状态',
  );
}

export async function startAlgorithmRun(userToken: string) {
  const message = 'BFIA 八算法运行未受理';
  // The global umi-request interceptor overwrites custom headers.
  const response = await fetch(`${root}/start`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'X-Requested-With': 'XMLHttpRequest', 'User-Token': userToken },
  });
  const envelope: Response<AlgorithmRunState> = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(envelope?.status?.msg || message);
  const state = readRunState(envelope, message);
  if (!state.run) throw new Error('BFIA 未返回受理的运行记录');
  return state;
}

export async function getAlgorithmRunReport(runId: string) {
  return readResponse(
    await request<Response<Record<string, unknown>>>(
      `${root}/${encodeURIComponent(runId)}/report`,
    ),
    '无法读取 BFIA 验证报告',
  );
}

export async function getAlgorithmRunLog(
  runId: string,
  algorithm: string,
  party: 'alice' | 'bob',
) {
  const result = readResponse(
    await request<Response<{ content: string }>>(
      `${root}/${encodeURIComponent(runId)}/log`,
      {
        params: { algorithm, party },
      },
    ),
    '无法读取 BFIA 运行日志',
  );
  if (typeof result.content !== 'string') throw new Error('运行日志返回格式不正确');
  return result.content;
}

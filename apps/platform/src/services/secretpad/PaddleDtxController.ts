import request from 'umi-request';

export type PaddleDtxStatus = {
  engine?: string;
  ready?: boolean;
  requesterConfigured?: boolean;
  healthAddress?: string;
  httpStatus?: number;
  error?: string;
};

export type PaddleDtxTask = {
  taskId: string;
  name?: string;
  type?: string;
  status: string;
  publishTime?: string;
};

export async function getPaddleDtxStatus(options?: { [key: string]: any }) {
  return request<API.SecretPadResponse_Object_>('/api/v1alpha1/paddledtx/status', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function submitPaddleDtxTask(
  body: Record<string, any>,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_Object_>('/api/v1alpha1/paddledtx/task/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function getPaddleDtxTask(
  taskId: string,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_Object_>('/api/v1alpha1/paddledtx/task/get', {
    method: 'GET',
    params: { taskId },
    ...(options || {}),
  });
}

export async function listPaddleDtxTasks() {
  return request<API.SecretPadResponse_Object_>('/api/v1alpha1/paddledtx/task/list', {
    method: 'POST',
  });
}

export async function startPaddleDtxTask(taskId: string) {
  return request<API.SecretPadResponse_Object_>('/api/v1alpha1/paddledtx/task/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { taskId },
  });
}

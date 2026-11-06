import request from 'umi-request';

/** FATE job submit */
export async function submitFateJob(
  body: API.FateJobRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_FateJobVO_>('/api/v1alpha1/fate/job/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** FATE job stop */
export async function stopFateJob(
  params: { jobId: string },
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_FateJobVO_>('/api/v1alpha1/fate/job/stop', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

/** FATE job get */
export async function getFateJob(
  params: { jobId: string },
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_FateJobVO_>('/api/v1alpha1/fate/job/get', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** FATE job list */
export async function listFateJobs(
  params?: { clusterId?: string; projectId?: string },
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_List_FateJobVO__>('/api/v1alpha1/fate/job/list', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

import request from 'umi-request';

/** FATE model create */
export async function createFateModel(
  body: API.FateModelRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_FateModelVO_>('/api/v1alpha1/fate/model/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** FATE model update */
export async function updateFateModel(
  params: { modelId: string },
  body: API.FateModelRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_FateModelVO_>('/api/v1alpha1/fate/model/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    params,
    data: body,
    ...(options || {}),
  });
}

/** FATE model delete */
export async function deleteFateModel(
  params: { modelId: string },
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_Boolean_>('/api/v1alpha1/fate/model/delete', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

/** FATE model get */
export async function getFateModel(
  params: { modelId: string },
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_FateModelVO_>('/api/v1alpha1/fate/model/get', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** FATE model list */
export async function listFateModels(
  params?: { jobId?: string; clusterId?: string },
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_List_FateModelVO__>('/api/v1alpha1/fate/model/list', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

import request from 'umi-request';

/** FATE dataset create */
export async function createFateDataset(
  body: API.FateDatasetRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_FateDatasetVO_>('/api/v1alpha1/fate/dataset/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** FATE dataset update */
export async function updateFateDataset(
  params: { datasetId: string },
  body: API.FateDatasetRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_FateDatasetVO_>('/api/v1alpha1/fate/dataset/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    params,
    data: body,
    ...(options || {}),
  });
}

/** FATE dataset delete */
export async function deleteFateDataset(
  params: { datasetId: string },
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_Boolean_>('/api/v1alpha1/fate/dataset/delete', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

/** FATE dataset get */
export async function getFateDataset(
  params: { datasetId: string },
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_FateDatasetVO_>('/api/v1alpha1/fate/dataset/get', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** FATE dataset list */
export async function listFateDatasets(
  params?: { clusterId?: string; nodeId?: string },
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_List_FateDatasetVO__>('/api/v1alpha1/fate/dataset/list', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

import request from 'umi-request';

/** FATE cluster create */
export async function createFateCluster(
  body: API.FateClusterRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_FateClusterVO_>('/api/v1alpha1/fate/cluster/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** FATE cluster update */
export async function updateFateCluster(
  params: { clusterId: string },
  body: API.FateClusterRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_FateClusterVO_>('/api/v1alpha1/fate/cluster/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    params,
    data: body,
    ...(options || {}),
  });
}

/** FATE cluster delete */
export async function deleteFateCluster(
  params: { clusterId: string },
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_Boolean_>('/api/v1alpha1/fate/cluster/delete', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

/** FATE cluster get */
export async function getFateCluster(
  params: { clusterId: string },
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_FateClusterVO_>('/api/v1alpha1/fate/cluster/get', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** FATE cluster list */
export async function listFateClusters(
  params?: { nodeId?: string },
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_List_FateClusterVO__>('/api/v1alpha1/fate/cluster/list', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

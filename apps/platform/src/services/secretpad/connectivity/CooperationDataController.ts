import request from 'umi-request';
export async function cooperationDataList(
  params: { [key: string]: any },
  // body?: API.PageMyDataListRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_SecretPadPageResponse_CooperationDataListVO__>(
    '/api/v1bfia/dataset/pub/list',
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        ...params,
      },
      // data: body,
      ...(options || {}),
    },
  );
}

export async function getPublicDataStatus(
  params: { [key: string]: any },
  // body?: API.PageMyDataListRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_CooperationDatatableVO_>(
    '/api/v1bfia/dataset/pub/query',
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        ...params,
      },
      // data: body,
      ...(options || {}),
    },
  );
}

export async function applyData(
  // params: { [key: string]: any },
  body?: API.ApplyDataRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_CooperationDatatableVO_>(
    '/api/v1bfia/dataset/audit/apply',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // params: {
      //   ...params,
      // },
      data: body,
      ...(options || {}),
    },
  );
}

export async  function applyHistory(
  params: { [key: string]: any },
  // body?: API.PageMyDataListRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_SecretPadPageResponse_CooperationHistoryListVO__>(
    '/api/v1bfia/dataset/applyed/history',
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        ...params,
      },
      // data: body,
      ...(options || {}),
    },
  );
}

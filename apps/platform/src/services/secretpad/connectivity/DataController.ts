import request from 'umi-request';
export async function myDataList(
  // params: { [key: string]: any },
  body?: API.PageMyDataListRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_SecretPadPageResponse_MyDataListVO__>(
    '/api/v1bfia/dataset/list',
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

export async function createData(
  body?: API.CreateDataRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_String_>('/api/v1bfia/dataset/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function deleteDatatable(
  body?: API.DeleteDatatableRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse>('/api/v1bfia/dataset/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function getDatatable(
  body?: API.GetDatatableRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_DatatableVO_>('/api/v1bfia/dataset/get', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function authProjectData(
  body?: API.AddProjectDatatableRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_String_>('/api/v1bfia/dataset/authorize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function authNodeData(
  body?: API.AuthNodeDatatableRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_String_>('/api/v1bfia/dataset/public', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async  function authHistory(
  params: { [key: string]: any },
  // body?: API.PageMyDataListRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_SecretPadPageResponse_AuthDataHistoryListVO__>(
    '/api/v1bfia/dataset/approved/history',
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

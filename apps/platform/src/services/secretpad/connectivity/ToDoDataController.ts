import request from 'umi-request';
export async function toDoDataList(
  params: { [key: string]: any },
  // body?: API.PageMyDataListRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_SecretPadPageResponse_ToDoDataListVO__>(
    '/api/v1bfia/dataset/list/approved',
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

export async function auditConfirmData(
  // params: { [key: string]: any },
  body?: API.AuditConfirmDataRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse>(
    '/api/v1bfia/dataset/audit/confirm',
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

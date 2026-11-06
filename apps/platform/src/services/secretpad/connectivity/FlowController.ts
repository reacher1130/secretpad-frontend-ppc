import request from 'umi-request';
export async function flowList(
  params: { [key: string]: any },
  // body?: API.PageMyDataListRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_SecretPadPageResponse_FlowListVO__>(
    '/api/v1bfia/flow/audit/page',
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

export async function createFlow(
  // params: { [key: string]: any },
  body?: API.CreatFlowRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_String_>(
    '/api/v1bfia/flow/create',
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

export async function applyFlow(
  // params: { [key: string]: any },
  body?: API.ApplyFlowRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_String_>(
    '/api/v1bfia/flow/audit/apply',
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


export async function confirmFlow(
  // params: { [key: string]: any },
  body?: API.ConfirmFlowRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_String_>(
    '/api/v1bfia/flow/audit/confirm',
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

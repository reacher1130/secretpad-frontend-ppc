import request from 'umi-request';

/** List BFIA components api
@return successful SecretPadResponse with BFIA component list
 GET /v1/interconn/components/list */
export async function listBfiaComponents(options?: { [key: string]: any }) {
  return request<API.SecretPadResponse_Map_String_Object_>(
    '/v1/interconn/components/list',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/** List BFIA component list VO api
@return successful SecretPadResponse with BFIA component list VO
 GET /v1/interconn/components/listCompListVO */
export async function listBfiaCompListVO(options?: { [key: string]: any }) {
  return request<API.SecretPadResponse_Map_String_CompListVO__>(
    '/v1/interconn/components/listCompListVO',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

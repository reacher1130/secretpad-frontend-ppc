/* eslint-disable */
import request from 'umi-request';

/** 获取协议配置 GET /api/v1alpha1/config/protocol */
export async function getProtocolConfig(options?: { [key: string]: any }) {
  return request<API.SecretPadResponse_ProtocolConfigVO_>(
    '/api/v1alpha1/config/protocol',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/** 重启 Kuscia 引擎 POST /api/v1alpha1/node/kuscia/restart */
export async function restartKuscia(
  body?: API.KusciaRestartRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_ProtocolConfigVO_>(
    '/api/v1alpha1/node/kuscia/restart',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      ...(options || {}),
    },
  );
}

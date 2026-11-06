import request from 'umi-request';

export interface ConfiguredPeer {
  nodeId: string;
  nodeName?: string;
  name?: string;
  netAddress?: string;
}

export interface CooperationRequest {
  contractId: string;
  nodeId?: string;
  name?: string;
  institution?: string;
  initiatorNodeName?: string;
  expiredTime?: number;
  authType?: string;
  address?: string;
  description?: string;
  status: string;
  direction?: 'INBOUND' | 'OUTBOUND';
  canConfirm?: boolean;
}

type Response<T> = {
  status?: { code?: number; msg?: string };
  data?: T;
};

const path = '/api/v1bfia/node';

function requireSuccess<T>(response: Response<T>, failureMessage: string): T {
  if (response?.status?.code !== 0) {
    throw new Error(response?.status?.msg || failureMessage);
  }
  if (response.data == null) {
    throw new Error(failureMessage);
  }
  return response.data;
}

export async function listCooperationRequests(page: number, pageSize: number) {
  const data = requireSuccess(
    await request<Response<{ records: CooperationRequest[]; total: number }>>(
      `${path}/list/apply`,
      { params: { page_num: page, page_size: pageSize } },
    ),
    '合作申请加载失败',
  );
  if (!Array.isArray(data.records) || typeof data.total !== 'number') {
    throw new Error('合作申请列表格式错误');
  }
  return data;
}

export async function listConfiguredPeers() {
  const peers = requireSuccess(
    await request<Response<ConfiguredPeer[]>>(`${path}/list/configured`),
    '已配置合作节点加载失败',
  );
  if (!Array.isArray(peers)) {
    throw new Error('已配置合作节点列表格式错误');
  }
  return peers;
}

async function submitContractAction(
  action: 'apply' | 'confirm',
  data: Record<string, unknown>,
  failureMessage: string,
) {
  const accepted = requireSuccess(
    await request<Response<boolean>>(`${path}/contract/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    }),
    failureMessage,
  );
  if (accepted !== true) {
    throw new Error(failureMessage);
  }
}

export function applyCooperation(nodeId: string, expiredTime: number) {
  return submitContractAction(
    'apply',
    { node_id: nodeId, expired_time: expiredTime },
    '合作申请未提交成功，请重试',
  );
}

export function confirmCooperation(contractId: string, status: string) {
  return submitContractAction(
    'confirm',
    { contract_id: contractId, status },
    '合作审批未确认，请刷新后重试',
  );
}

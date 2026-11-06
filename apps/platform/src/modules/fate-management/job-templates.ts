export const FATE_JOB_TEMPLATES = [
  {
    id: 'psi',
    title: '隐私求交',
    description: '对齐双方样本，生成可用于联合分析的交集数据。',
    steps: ['双方数据', 'PSI 求交', '交集结果'],
    detail: '1 个步骤 · 样本对齐',
  },
  {
    id: 'psi-lr',
    title: '求交 + 逻辑回归',
    description: '先对齐样本，再进行纵向联邦训练，生成双方模型。',
    steps: ['双方数据', 'PSI 求交', '逻辑回归'],
    detail: '2 个步骤 · 联邦训练',
  },
] as const;

export type FateJobTemplateId = (typeof FATE_JOB_TEMPLATES)[number]['id'];

export interface FateTemplateBindings {
  guestPartyId: string;
  hostPartyId: string;
  guestDatasetRef: string;
  hostDatasetRef: string;
  guestDatasetId?: string;
  hostDatasetId?: string;
  epochs?: number;
}

export interface FateDagComponent {
  name: string;
  componentName: string;
  provider: string;
  version: string;
  input: { key: string; type: string }[];
  output: { key: string; type: string }[];
  parameter: Record<string, any>;
}

export function parseFateJson(value: string, label: string): Record<string, any> {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${label} 不是有效的 JSON，请检查格式`);
  }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error(`${label} 必须是 JSON 对象`);
  }
  return parsed;
}

export function buildFateTemplate(
  id: FateJobTemplateId,
  bindings: FateTemplateBindings,
) {
  const template = FATE_JOB_TEMPLATES.find((item) => item.id === id);
  if (!template) throw new Error('请选择作业模板');
  const guest = bindings.guestPartyId.trim();
  const host = bindings.hostPartyId.trim();
  if (!guest || !host) throw new Error('请填写双方的 FATE 参与方 ID');
  if (
    [guest, host].some((party) =>
      ['alice', 'bob', 'kimi'].includes(party.toLowerCase()),
    )
  ) {
    throw new Error('请使用 FATE 参与方 ID，不能使用 Alice、Bob、Kimi 节点名');
  }
  for (const ref of [bindings.guestDatasetRef, bindings.hostDatasetRef]) {
    if (!/^[^#\s]+#[^#\s]+$/.test(ref)) throw new Error('请选择双方已登记的数据集');
  }
  const epochs = bindings.epochs ?? 2;
  if (id === 'psi-lr' && (!Number.isInteger(epochs) || epochs < 1 || epochs > 1000)) {
    throw new Error('训练轮数须为 1 到 1000 的整数');
  }

  const components: FateDagComponent[] = [
    {
      name: 'psi_0',
      componentName: 'psi',
      provider: 'fate',
      version: '2.0.0',
      input: [],
      output: [{ key: 'data', type: 'dataset' }],
      parameter: { protocol: 'ecdh_psi', curve_type: 'curve25519' },
    },
  ];
  if (id === 'psi-lr') {
    components.push({
      name: 'coordinated_lr_1',
      componentName: 'coordinated_lr',
      provider: 'fate',
      version: '2.0.0',
      input: [{ key: 'psi_0.data', type: 'dataset' }],
      output: [{ key: 'data', type: 'dataset' }],
      parameter: { epochs },
    });
  }
  return {
    template,
    bindings: { ...bindings, guestPartyId: guest, hostPartyId: host },
    dag: { version: '2.0', components },
    config: {
      version: '2.0',
      initiator: { node_id: guest, party_id: guest, role: 'guest' },
      role: { guest: [guest], host: [host], arbiter: [] },
      job_params: { common: { sync_type: 'poll' } },
      task_params: {
        ...(id === 'psi-lr' ? { common: { coordinated_lr_1: { epochs } } } : {}),
        guest: { '0': { psi_0: { dataset_id: bindings.guestDatasetRef } } },
        host: { '0': { psi_0: { dataset_id: bindings.hostDatasetRef } } },
      },
    },
  };
}

export type FateTemplateResult = ReturnType<typeof buildFateTemplate>;

export function templateDatasetOptions(
  datasets: API.FateDatasetVO[],
  clusterId: string | undefined,
  role: 'guest' | 'host',
) {
  return datasets.filter(
    (item) =>
      !!clusterId &&
      item.clusterId === clusterId &&
      item.role?.toLowerCase() === role &&
      !!item.datasetId &&
      !!item.namespace &&
      !!item.tableName,
  );
}

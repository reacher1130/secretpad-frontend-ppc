export const protocolProfiles = {
  secretflow: {
    label: '隐语',
    caption: '安全计算',
    color: '#5065db',
    soft: '#edf0ff',
    title: '让数据协作，更进一步',
    description: '从数据准备到联合计算，在同一个空间连接伙伴、构建训练流。',
    category: 'SECURE COMPUTING',
    peer: 'Kimi',
    mode: '多方安全计算',
  },
  bfia: {
    label: 'BFIA',
    caption: '开放互联',
    color: '#127f83',
    soft: '#e7f5f3',
    title: '跨越平台，连接每一次协作',
    description: '统一管理跨平台合作、数据授权与算法流程，让协同过程清晰可见。',
    category: 'OPEN INTEROPERABILITY',
    peer: 'Bob',
    mode: '跨平台互联',
  },
  fate: {
    label: 'FATE',
    caption: '联邦学习',
    color: '#7854c5',
    soft: '#f1ecfc',
    title: '把联邦学习，变成可管理的实验',
    description: '集中组织计算资源、训练任务与模型成果，让每一步实验有迹可循。',
    category: 'FEDERATED LEARNING',
    peer: 'Guest / Host',
    mode: '联邦学习',
  },
  paddledtx: {
    label: '链桨',
    caption: '可信协作',
    color: '#a56826',
    soft: '#fbf0df',
    title: '计算协作，从可信连接开始',
    description: '查看执行环境，配置参与数据，按步骤发起训练或预测任务。',
    category: 'TRUSTED COLLABORATION',
    peer: '双执行器',
    mode: '链上协同计算',
  },
} satisfies Record<
  API.PrivacyProtocol,
  {
    label: string;
    caption: string;
    color: string;
    soft: string;
    title: string;
    description: string;
    category: string;
    peer: string;
    mode: string;
  }
>;

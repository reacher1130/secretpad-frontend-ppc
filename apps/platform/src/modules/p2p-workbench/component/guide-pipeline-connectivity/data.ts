export const nodes = [
  {
    id: '1',
    shape: 'guide-input-node',
    x: 160,
    y: 60,
    data: {
      name: 'Alice',
      icon: '',
    },
  },
  {
    id: '2',
    shape: 'guide-input-node',
    x: 160,
    y: 178,
    data: {
      name: 'Bob',
      icon: '',
    },
  },
  {
    id: '3',
    shape: 'guide-node',
    x: 227,
    y: 60,
    data: {
      name: '上传数据',
      icon: '',
      index: 1,
      description: '上传计算所需数据',
    },
  },

  {
    id: '4',
    shape: 'guide-node',
    x: 227,
    y: 185,
    data: {
      name: '上传数据',
      icon: '',
      index: 3,
      description: '上传计算所需数据',
    },
  },

  {
    id: '5',
    shape: 'guide-node',
    x: 445,
    y: 60,
    data: {
      name: '添加合作节点',
      icon: '',
      index: 2,
      description: '建立网络授权',
    },
  },

  {
    id: '6',
    shape: 'guide-node',
    x: 445,
    y: 185,
    data: {
      name: '同意节点合作',
      icon: '',
      index: 4,
      description: '确认合作节点',
    },
  },

  {
    id: '7',
    shape: 'guide-node',
    x: 663,
    y: 60,
    data: {
      name: '申请数据授权',
      icon: '',
      index: 5,
      description: '上传数据并申请数据',
    },
  },

  {
    id: '8',
    shape: 'guide-node',
    x: 663,
    y: 185,
    data: {
      name: '同意数据授权',
      icon: '',
      index: 6,
      description: '确认合作方申请数据',
    },
  },

  {
    id: '9',
    shape: 'guide-node',
    x: 871,
    y: 60,
    data: {
      name: '创建联合项目',
      icon: '',
      index: 7,
      description: '发起项目合作邀约',
    },
  },
  {
    id: '10',
    shape: 'guide-node',
    x: 871,
    y: 185,
    data: {
      name: '同意加入项目',
      icon: '',
      index: 8,
      description: '确认无误后加入',
    },
  },
  {
    id: '11',
    shape: 'guide-node',
    x: 1089,
    y: 60,
    data: {
      name: '创建流程作业',
      icon: '',
      index: 9,
      description: '配置流程并申请',
    },
  },
  {
    id: '12',
    shape: 'guide-node',
    x: 1089,
    y: 185,
    data: {
      name: '同意流程作业',
      icon: '',
      index: 10,
      description: '确认流程申请',
    },
  },
  {
    id: '13',
    shape: 'guide-node',
    x: 1295,
    y: 123,
    data: {
      name: '发起计算任务',
      icon: '',
      index: 11,
      description: '配置任务后发起',
    },
  },
  {
    id: '14',
    shape: 'guide-node',
    x: 1295,
    y: 346,
    data: {
      name: '查看计算结果',
      icon: '',
      index: 13,
      description: '可查看单边运行结果',
    },
  },
];

export const edges = [
  {
    id: '1',
    shape: 'guide-edge',
    source: '1',
  },
  {
    id: '2',
    shape: 'guide-edge',
    source: '2',
  },
  {
    id: '3-5',
    shape: 'guide-edge',
    source: '3',
    target: '5',
    router: 'orth',
  },
  {
    id: '4-6',
    shape: 'guide-edge',
    source: '4',
    target: '6',
    router: 'orth',
  },
  {
    id: '5-6',
    shape: 'guide-edge',
    source: '5',
    target: '6',
    router: 'orth',
  },
  {
    id: '6-8',
    shape: 'guide-edge',
    source: '6',
    target: '8',
    router: 'orth',
  },
  {
    id: '5-7',
    shape: 'guide-edge',
    source: '5',
    target: '7',
    router: 'orth',
  },
  {
    id: '7-8',
    shape: 'guide-edge',
    source: '7',
    target: '8',
  },
  {
    id: '7-9',
    shape: 'guide-edge',
    source: '7',
    target: '9',
    router: 'orth',
  },
  {
    id: '9-10',
    shape: 'guide-edge',
    source: '9',
    target: '10',
    router: 'orth',
  },
  {
    id: '8-10',
    shape: 'guide-edge',
    source: '8',
    target: '10',
  },
  {
    id: '9-11',
    shape: 'guide-edge',
    source: '9',
    target: '11',
    router: 'orth',
  },
  {
    id: '11-12',
    shape: 'guide-edge',
    source: '11',
    target: '12',
    router: 'orth',
  },
  {
    id: '10-12',
    shape: 'guide-edge',
    source: '10',
    target: '12',
  },

  {
    id: '11-13',
    shape: 'guide-edge',
    source: '11',
    target: '13',
    router: 'orth',
  },
  {
    id: '12-13',
    shape: 'guide-edge',
    source: '12',
    target: '13',
    // router: 'orth',
  },
  {
    id: '13-14',
    shape: 'guide-edge',
    source: '13',
    target: '14',
    router: 'orth',
  },

];

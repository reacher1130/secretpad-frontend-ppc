export type BfiaAlgorithm = {
  id: string;
  label: string;
  runtime: 'Python' | 'C++';
  standard: 'standard' | 'extension';
  basis: string;
  source?: string;
  summary: string;
  steps: string[];
  output: string;
};

export const BFIA_ALGORITHM_CATALOG: readonly BfiaAlgorithm[] = [
  {
    id: 'sgb',
    label: 'SGB',
    runtime: 'Python',
    standard: 'standard',
    basis: 'PPCA 10—2023 · 开放协议第 4 部分：Secure Gradient Boosting',
    source: 'https://github.com/caict-ppca/privacy-computing/blob/main/SGB.pdf',
    summary:
      '安全梯度提升树。双方各持一部分特征，只有标签方持有分类标签；用 Paillier 半同态加密保护建树所需的梯度统计。',
    steps: [
      '协商树训练参数和 Paillier 密钥规格，标签方计算并加密每条样本的一阶和二阶梯度。',
      '特征方在本地对特征分箱，按候选切分累加密文梯度，将聚合结果送回标签方。',
      '标签方解密聚合统计，比较切分增益；双方按选中的分裂反复生长树并提升预测。',
    ],
    output: '梯度提升树的分类概率；公开样例还复算训练样本的 AUC。',
  },
  {
    id: 'he_woe',
    label: 'HE-WOE',
    runtime: 'Python',
    standard: 'extension',
    basis: '项目扩展 · BFIA 握手 + Paillier 标签统计',
    summary:
      '隐私证据权重。用正负样本在各分箱中的占比衡量特征的区分能力，标签明细不发给特征方。',
    steps: [
      '标签方用 Paillier 公钥加密二值标签，向特征方发送公钥和密文标签。',
      '特征方本地分箱，返回每箱的样本总数和密文正例计数；分箱边界留在本地。',
      '标签方解密汇总计数，计算 WOE = ln(正例占比 / 负例占比)；分箱占比之差乘 WOE 得到该箱的 IV 贡献。空类别按本实现的规则平滑。',
    ],
    output: '各箱的 WOE 和对应 IV 贡献，用于特征评估与编码。',
  },
  {
    id: 'ecdh-psi',
    label: 'ECDH-PSI',
    runtime: 'C++',
    standard: 'standard',
    basis: 'PPCA 9—2023 · 开放协议第 1 部分：ECDH-PSI（v2.0）',
    source:
      'https://interconnection.readthedocs.io/zh-cn/latest/_downloads/6f648f6f845ac0c9c3fcedc1b4785c9d/ECDH-PSI.pdf',
    summary: '椭圆曲线隐私集合求交。找出两方都拥有的标识，双方无需交换原始标识全集。',
    steps: [
      '双方协商椭圆曲线、哈希及映射参数，将本地标识映射到曲线点。',
      '双方各用本方秘密标量处理曲线点，交换处理后的点，再施加另一方的标量。',
      '同一标识满足 a(bH(id)) = b(aH(id))；约定的接收方匹配这些双重掩蔽值并定位本地交集。',
    ],
    output: '双方集合的交集；公开样例核验交集 ID 与预期完全一致。',
  },
  {
    id: 'ss-lr',
    label: 'SS-LR',
    runtime: 'C++',
    standard: 'standard',
    basis: 'PPCA 7—2023 · 开放协议第 2 部分：SS-LR',
    source: 'https://github.com/caict-ppca/privacy-computing/blob/main/SS-LR.pdf',
    summary:
      '秘密分享逻辑回归。在不汇集原始特征和标签的情况下，对双方纵向拆分的数据训练二分类模型。',
    steps: [
      '双方按相同样本顺序准备各自的特征列，并将特征和标签编码成定点秘密份额。',
      '在 Semi2k 中计算线性得分、近似 Sigmoid 和梯度，各方单独持有的份额不能还原中间值。',
      '按约定学习率用梯度更新权重，验证时将公开样例的结果和同参数参考计算对比。',
    ],
    output: '模型权重和样本预测分数的双方份额。',
  },
  {
    id: 'ss-xgb',
    label: 'SS-XGB',
    runtime: 'C++',
    standard: 'extension',
    basis: '项目扩展 · BFIA 握手 + Semi2k 秘密分享',
    summary:
      '秘密分享梯度提升树。用秘密份额计算分裂和叶权重，底层与本套件的 Paillier SGB 不同。',
    steps: [
      '按双方特征构建等宽分箱，使用秘密份额聚合各候选分裂的梯度统计。',
      '在安全计算中比较切分增益，用聚合的一阶梯度 G 和二阶梯度 H 计算叶权重 −G/(H+λ)，迭代训练多棵树。',
      '累加各树输出并应用学习率，得到二分类概率；可用模型产物复算验证。',
    ],
    output: '分类概率份额和模型产物；公开样例对照同参数参考预测。',
  },
  {
    id: 'ss-pearson',
    label: 'SS-Pearson',
    runtime: 'C++',
    standard: 'extension',
    basis: '项目扩展 · BFIA 握手 + Semi2k 秘密分享',
    summary:
      '秘密分享 Pearson 相关系数。衡量双方特征两两的线性相关程度，不汇集原始特征值。',
    steps: [
      '按样本对齐双方特征列，将数值编码为秘密份额，在安全计算中减去各列均值。',
      '计算中心化列之间的协方差，再除以两列标准差的乘积，得到相关系数。',
      '按照约定的接收方重构相关矩阵，并与公开样例参考矩阵比较。',
    ],
    output: '特征两两的 Pearson 相关系数矩阵。',
  },
  {
    id: 'ss-vif',
    label: 'SS-VIF',
    runtime: 'C++',
    standard: 'extension',
    basis: '项目扩展 · BFIA 握手 + Semi2k 秘密分享',
    summary:
      '秘密分享方差膨胀因子。检查一个特征能否被其他特征线性解释，用于识别多重共线性。',
    steps: [
      '对双方对齐的特征列做中心化和标准化，用秘密份额求相关矩阵。',
      '在秘密分享计算中用 Newton–Schulz 迭代近似求逆；逆矩阵的对角元素就是各特征的 VIF。',
      '按约定接收方输出 VIF，用公开样例的参考逆矩阵校验。',
    ],
    output: '每个特征一个 VIF 值；数值越大，通常说明与其他特征的线性共线性越强。',
  },
  {
    id: 'ss-compare',
    label: 'SS-Compare',
    runtime: 'C++',
    standard: 'extension',
    basis: '项目扩展 · BFIA 握手 + Semi2k 安全比较',
    summary:
      '秘密分享安全比较。对齐后的两个数值列逐行比较，让结果接收方得到真假而无需拿到比较双方的原始数值。',
    steps: [
      '双方协商比较算子、要比较的列及结果接收方。',
      '将列值编码成秘密份额，在 Semi2k 中逐行执行比较。',
      '按约定重构比较结果；本次公开用例比较 Alice 的 x1 是否大于 Bob 的 x11。',
    ],
    output: '逐行布尔比较结果。',
  },
];

export const PADDLE_ALGORITHM_DEMOS = [
  {
    id: 'paddledtx-linear-vl-demo',
    label: '链桨 · 纵向线性回归',
    basis: 'PaddleDTX · linear-vl · Paillier 同态加密',
    summary:
      '双方分别持有同一批样本的不同特征，标签方持有连续目标值，联合训练线性模型。',
    steps: [
      '按样本标识求交，双方各自保留原始特征列。',
      '双方交换加密的中间统计量，分别计算并更新本方梯度。',
      '预测时组合双方的线性得分，得到连续数值。',
    ],
    output: '双方的模型参数；预测输出为连续数值。',
    demoData:
      '示例样本 S01：A 方特征面积 = 80，B 方特征楼龄 = 12。\n假设 A 方局部得分 = 18.4，B 方局部得分 = 3.6；示例预测值 = 22.0。',
    demoLog:
      '[示例] 样本对齐：两方按 ID 关联 S01\n[示例] 训练轮次：交换加密中间量，各自更新参数\n[示例] 预测格式：sample_id=S01, prediction=22.0',
  },
  {
    id: 'paddledtx-logistic-vl-demo',
    label: '链桨 · 纵向逻辑回归',
    basis: 'PaddleDTX · logistic-vl · Paillier 同态加密',
    summary: '双方各自保留特征，标签方持有二值标签，联合训练分类模型。',
    steps: [
      '对齐样本，标签方保留 0/1 标签。',
      '训练时保护中间量，以梯度更新双方持有的模型参数。',
      '预测时组合双方的线性得分，经 Sigmoid 转为正类概率。',
    ],
    output: '双方的模型参数；预测输出为正类概率。',
    demoData:
      '示例样本 S01：A 方特征年龄 = 35，B 方特征活跃次数 = 12。\n假设双方合计得分 = 1.10；示例正类概率约为 0.75。',
    demoLog:
      '[示例] 样本对齐：两方按 ID 关联 S01\n[示例] 训练轮次：计算受保护的梯度并更新参数\n[示例] 预测格式：sample_id=S01, probability=0.75',
  },
];

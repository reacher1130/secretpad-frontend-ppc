/* eslint-disable */
// 补充 connectivity 模块用到的 API 类型字段（由 OneAPI 生成的接口为空或缺失）

declare namespace API {
  interface MyDataListVO {
    /** 数据表 ID */
    dataset_id?: string;
    /** 数据表名称 */
    name?: string;
    /** 数据表展示名 */
    tableName?: string;
    /** 数据源类型 */
    datasourceType?: string;
    /** 数据源 ID */
    datasourceId?: string;
    /** 数据源名称 */
    datasourceName?: string;
    /** 数据地址 */
    relativeUri?: string;
    /** 描述 */
    description?: string;
    /** 状态 */
    status?: string;
    /** 数据表类型 */
    type?: string;
    /** 表结构 */
    schema?: Array<DatatableSchema>;
    /** 创建时间 */
    gmtCreate?: number;
    /** 数据所属节点 */
    owner?: string;
    /** 合约 ID */
    contract_id?: string;
    /** 已授权项目 */
    authProjects?: Array<AuthProjectVO>;
  }

  interface CooperationDataListVO {
    /** 数据表 ID */
    dataset_id?: string;
    /** 数据表展示名 */
    tableName?: string;
    /** 数据源类型 */
    datasourceType?: string;
    /** 已授权项目 */
    authProjects?: Array<AuthProjectVO>;
    /** 状态 */
    status?: string;
    /** 创建时间 */
    gmtCreate?: number;
    /** 描述 */
    description?: string;
  }

  interface CooperationDatatableVO {
    /** 状态 */
    status?: string;
  }

  interface CooperationHistoryVO_ {
    /** 审批 ID */
    auditId?: string;
    /** 授权范围 */
    authScope?: string;
    /** 状态 */
    status?: string;
    /** 申请时间 */
    applyTime?: number;
    /** 审批时间 */
    approvedTime?: number;
  }

  interface ToDoDataListVO {
    /** 审批 ID */
    auditId?: string;
    /** 数据表名 */
    name?: string;
    /** 申请方节点名 */
    applyNodeName?: string;
    /** 申请授权范围 */
    authScope?: string;
    /** 数据创建时间 */
    datasetCreateTime?: number;
    /** 申请时间 */
    applyTime?: number;
  }

  interface FlowListVO_Content {
    /** 流程 ID */
    flowId?: string;
    /** 流程名 */
    name?: string;
    /** 申请方节点名 */
    applyNodeName?: string;
    /** 审批方节点名 */
    participantNodeName?: string;
    /** 状态 */
    status?: string;
    /** 创建时间 */
    gmtCreate?: number;
    /** 申请时间 */
    applyTime?: number;
    /** 审批结束时间 */
    approvedTime?: number;
    /** 描述 */
    description?: string;
    /** 所有者 ID */
    ownerId?: string;
    /** 是否草稿 */
    isDraft?: number;
    /** 审批 ID */
    auditId?: string;
  }

  interface CreatFlowRequest {
    /** 项目 ID */
    projectId?: string;
    /** 流程名 */
    name?: string;
    /** 描述 */
    description?: string;
  }

  interface P2pCreateNodeRequest {
    /** 节点通讯地址 */
    pad_address?: string;
    /** 计算节点 ID */
    node_id?: string;
    /** 过期时间 */
    expired_time?: number;
  }

  /** P2P 项目视图，扩展自 ProjectVO */
  interface ConnectivityProject extends ProjectVO {
    /** 项目展示名 */
    name?: string;
    /** 类型 */
    type?: string;
    /** 审批 ID */
    auditId?: string;
    /** 合约 ID */
    contractId?: string;
    /** 发起方节点 ID */
    initiatorNodeId?: string;
    /** 流程数 */
    flowCount?: number;
    /** 任务数 */
    jobCount?: number;
  }

  /** ConnectivityProjectVO 与 ConnectivityProject 等价 */
  type ConnectivityProjectVO = ConnectivityProject;

  interface PartyVoteInfoVO {
    /** 节点 ID */
    nodeId?: string;
    /** 节点名称 */
    nodeName?: string;
  }

  interface NodeRouterVO {
    /** 合约 ID */
    contractId?: string;
    /** 节点名 */
    name?: string;
    /** 所属机构 */
    institution?: string;
    /** 发起方节点名 */
    initiatorNodeName?: string;
    /** 过期时间 */
    expiredTime?: number;
    /** 认证方式 */
    authType?: string;
    /** 参与方地址 */
    address?: string;
    /** 描述 */
    description?: string;
  }

  interface NodeVO {
    /** 合约 ID */
    contract_id?: string;
  }

  interface DatasourceListInfo {
    /** 数据源名称 */
    name?: string;
    /** 数据源 ID */
    datasourceId?: string;
    /** 数据源类型 */
    type?: string;
    /** 状态 */
    status?: string;
  }

  interface DatasourceListInfoAggregate {
    /** 状态 */
    status?: string;
  }

  interface SecretPadPageResponse {
    /** 分页记录（records 风格） */
    records?: Array<Record<string, any>>;
    /** 总数（total 风格） */
    total?: number;
    /** 总数（totalElements 风格） */
    totalElements?: number;
    /** 内容列表（content 风格） */
    content?: Array<Record<string, any>>;
  }
}

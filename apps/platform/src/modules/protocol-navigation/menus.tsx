import {
  AppstoreOutlined,
  DatabaseOutlined,
  TeamOutlined,
  FolderOpenOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  ApartmentOutlined,
  CloudServerOutlined,
  PlayCircleOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import { parse } from 'query-string';
import { useLocation } from 'umi';

import { BfiaComponentListComponent } from '@/modules/bfia-component-list/bfia-component-list.view';
import { BfiaResultManagerComponent } from '@/modules/bfia-result-manager/result-manager.view';
import { ConnectivityCooperationDataManagerComponent } from '@/modules/connectivity/cooperation-data-manager';
import { ConnectivityCooperativeNodeListComponent } from '@/modules/connectivity/cooperative-node-list';
import { ConnectivityFlowComponent } from '@/modules/connectivity/flow-list';
import { ConnectivityDataManagerComponent } from '@/modules/connectivity/my-data-manager';
import { ConnectivityP2pProjectListComponent } from '@/modules/connectivity/p2p-project-list';
import { CooperativeNodeListComponent } from '@/modules/cooperative-node-list';
import { DataManagerComponent } from '@/modules/data-manager/data-manager.view';
import { DataSourceListComponent } from '@/modules/data-source-list';
import { FateManagementComponent } from '@/modules/fate-management';
import { tabComponentType } from '@/modules/layout/management-layout';
import { P2pProjectListComponent } from '@/modules/p2p-project-list';
import { P2PWorkbenchComponent } from '@/modules/p2p-workbench/workbench.view';
import { PaddleDtxManagementComponent } from '@/modules/paddledtx-management';
import { ResultManagerComponent } from '@/modules/result-manager/result-manager.view';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  key: string;
  component: React.ReactNode;
  children?: MenuItem[];
}

const ConnectivityProjectOrFlow = () => {
  const { search } = useLocation();
  const { tabComponent } = parse(search);
  return tabComponent === tabComponentType.FLOW ? (
    <ConnectivityFlowComponent />
  ) : (
    <ConnectivityP2pProjectListComponent />
  );
};

const bfiaMenuItems: MenuItem[] = [
  {
    label: '协作总览',
    icon: <AppstoreOutlined />,
    component: <P2PWorkbenchComponent protocol="bfia" />,
    key: 'workbench',
  },
  {
    label: '协作伙伴',
    icon: <DatabaseOutlined />,
    component: <ConnectivityCooperativeNodeListComponent />,
    key: 'connectivity-connected-node',
  },
  {
    label: '项目空间',
    icon: <FolderOpenOutlined />,
    component: <ConnectivityProjectOrFlow />,
    key: 'connectivity-my-project',
  },
  {
    label: '数据管理',
    icon: <DatabaseOutlined />,
    component: <ConnectivityDataManagerComponent />,
    key: 'connectivity-data',
    children: [
      {
        label: '我方数据',
        icon: <FolderOpenOutlined />,
        component: <ConnectivityDataManagerComponent />,
        key: 'connectivity-my-data-management',
      },
      {
        label: '合作方数据',
        icon: <FolderOpenOutlined />,
        component: <ConnectivityCooperationDataManagerComponent />,
        key: 'connectivity-cooperation-data-management',
      },
    ],
  },
  {
    label: '算法中心',
    icon: <ExperimentOutlined />,
    component: <BfiaComponentListComponent />,
    key: 'bfia-components',
  },
  {
    label: '计算成果',
    icon: <BarChartOutlined />,
    component: <BfiaResultManagerComponent />,
    key: 'bfia-result',
  },
];

const secretflowMenuItems: MenuItem[] = [
  {
    label: '协作总览',
    icon: <AppstoreOutlined />,
    component: <P2PWorkbenchComponent />,
    key: 'workbench',
  },
  {
    label: '数据连接',
    icon: <CloudServerOutlined />,
    component: <DataSourceListComponent />,
    key: 'data-source',
  },
  {
    label: '数据管理',
    icon: <DatabaseOutlined />,
    component: <DataManagerComponent />,
    key: 'data-management',
  },
  {
    label: '协作伙伴',
    icon: <TeamOutlined />,
    component: <CooperativeNodeListComponent />,
    key: 'connected-node',
  },
  {
    label: '项目空间',
    icon: <FolderOpenOutlined />,
    component: <P2pProjectListComponent />,
    key: 'my-project',
  },
  {
    label: '计算成果',
    icon: <BarChartOutlined />,
    component: <ResultManagerComponent />,
    key: 'result',
  },
];

export const protocolMenuItems: Record<API.PrivacyProtocol, MenuItem[]> = {
  secretflow: secretflowMenuItems,
  bfia: bfiaMenuItems,
  fate: [
    {
      label: '计算资源',
      icon: <CloudServerOutlined />,
      component: <FateManagementComponent section="clusters" />,
      key: 'fate-management',
    },
    {
      label: '训练任务',
      icon: <PlayCircleOutlined />,
      component: <FateManagementComponent section="jobs" />,
      key: 'fate-jobs',
    },
    {
      label: '数据资产',
      icon: <DatabaseOutlined />,
      component: <FateManagementComponent section="datasets" />,
      key: 'fate-datasets',
    },
    {
      label: '模型成果',
      icon: <FileDoneOutlined />,
      component: <FateManagementComponent section="models" />,
      key: 'fate-models',
    },
    {
      label: '可视化编排',
      icon: <ApartmentOutlined />,
      component: <FateManagementComponent section="canvas" />,
      key: 'fate-canvas',
    },
  ],
  paddledtx: [
    {
      label: '协作网络',
      icon: <ApartmentOutlined />,
      component: <PaddleDtxManagementComponent section="overview" />,
      key: 'paddledtx-management',
    },
    {
      label: '发起计算',
      icon: <PlayCircleOutlined />,
      component: <PaddleDtxManagementComponent section="task" />,
      key: 'paddledtx-task',
    },
    {
      label: '执行反馈',
      icon: <FileDoneOutlined />,
      component: <PaddleDtxManagementComponent section="results" />,
      key: 'paddledtx-results',
    },
  ],
};

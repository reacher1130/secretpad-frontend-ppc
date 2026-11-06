import {
  ArrowRightOutlined,
  DatabaseOutlined,
  FolderOpenOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { parse, stringify } from 'query-string';
import { history } from 'umi';

import { ConnectivityP2pProjectListComponent } from '@/modules/connectivity/p2p-project-list';
import { MessageComponent } from '@/modules/message-center';
import { P2pProjectListComponent } from '@/modules/p2p-project-list';

import styles from './index.less';

export const P2PWorkbenchComponent = ({
  protocol = 'secretflow',
}: {
  protocol?: 'secretflow' | 'bfia';
}) => {
  const connectivity = protocol === 'bfia';
  const actions = [
    {
      title: connectivity ? '管理协作数据' : '准备计算数据',
      description: connectivity ? '查看我方数据与授权范围' : '连接数据源，组织计算样本',
      icon: <DatabaseOutlined />,
      tab: connectivity ? 'connectivity-my-data-management' : 'data-management',
    },
    {
      title: '连接协作伙伴',
      description: connectivity ? '建立跨平台节点合作' : '查看节点与合作连接',
      icon: <TeamOutlined />,
      tab: connectivity ? 'connectivity-connected-node' : 'connected-node',
    },
    {
      title: '进入项目空间',
      description: connectivity ? '管理合作项目与算法流程' : '创建项目，编排联合训练流',
      icon: <FolderOpenOutlined />,
      tab: connectivity ? 'connectivity-my-project' : 'my-project',
    },
  ];
  const navigate = (tab: string) => {
    const { ownerId, nodeId } = parse(window.location.search);
    history.replace(`/edge?${stringify({ ownerId, nodeId, tab })}`);
  };
  return (
    <div className={styles.workbench}>
      <div className={styles.quickActions}>
        {actions.map((action, index) => (
          <button type="button" key={action.tab} onClick={() => navigate(action.tab)}>
            <span className={styles.actionIcon}>{action.icon}</span>
            <span>
              <small>0{index + 1}</small>
              <strong>{action.title}</strong>
              <span className={styles.actionDescription}>{action.description}</span>
            </span>
            <ArrowRightOutlined className={styles.actionArrow} />
          </button>
        ))}
      </div>
      <section className={styles.projects} aria-label="项目空间">
        {connectivity ? (
          <ConnectivityP2pProjectListComponent />
        ) : (
          <P2pProjectListComponent />
        )}
      </section>
      {!connectivity && (
        <details className={styles.requests}>
          <summary>
            <span>协作申请</span>
            <small>查看需要处理的申请与已发起事项</small>
          </summary>
          <MessageComponent />
        </details>
      )}
    </div>
  );
};

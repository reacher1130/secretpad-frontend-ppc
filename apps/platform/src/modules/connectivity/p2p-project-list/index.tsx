import React from 'react';
import { useEffect, useState } from 'react';
import styles from './index.less';
import classNames from 'classnames';
import { Button, Tooltip, Input, Space, Pagination, Typography, message } from 'antd';
import { getModel, Model, useModel } from '@/util/valtio-helper';
import { P2PCreateProjectModal } from './add-p2p-create-project-modal';
import {
  listP2PProject,
  auditConfirmProject,
} from '@/services/secretpad/connectivity/P2PProjectController';
import { ConfirmCooperativeNodeModal } from './confirm-cooperativeProject-modal';
import { ProjectType, ProjectTypeTag } from './components/project-type-tag';
import { AuthProjectTag } from './components/auth-project-tag';
import { formatTimestamp } from '@/modules/dag-result/utils';
import {
  ProjectNodePopover,
  ProjectPipeLinePopover,
  ProjectTaskPopover,
} from '@/modules/connectivity/project-list/components/popover';
import { P2pProjectButtons } from '../p2p-project-list/components/common';
import { parse } from 'query-string';
import { getPlatformNodeId } from '@/components/platform-wrapper';
import dayjs from 'dayjs';

export const ConnectivityP2pProjectListComponent: React.FC = () => {
  const projectListModel = useModel(ProjectListModel);
  const { handleCreateProject } = projectListModel;
  const { Title, Paragraph } = Typography;
  const nodeId = getPlatformNodeId() || parse(window.location.search).nodeId;
  const [hoverCurrent, setHoverCurrent] = useState(-1);
  return (
    <div className={classNames(styles.projectList)}>
      <div className={styles.projectListHeader}>
        <strong style={{ color: '#4c5972', fontSize: 14 }}>项目空间</strong>
        <Button type="primary" onClick={handleCreateProject}>
          新建项目
        </Button>
      </div>
      <div className={styles.content}>
        {projectListModel.projectList.map(
          (projectItem: API.ConnectivityProject, index) => {
            return (
              <div
                className={styles.projectBox}
                key={projectItem.projectId}
                onMouseEnter={() => {
                  setHoverCurrent(index);
                }}
                onMouseLeave={() => {
                  setHoverCurrent(-1);
                }}
              >
                <div className={styles.listBox}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ marginRight: 8 }}>
                      <ProjectTypeTag type={projectItem.type as ProjectType} />
                    </div>
                    <div className={styles.header} style={{ flex: 1 }}>
                      <Tooltip title={projectItem.name}>
                        <Title
                          className={styles.ellipsisName}
                          level={5}
                          ellipsis={true}
                        >
                          {projectItem.name}
                        </Title>
                      </Tooltip>
                    </div>
                  </div>
                  <Paragraph ellipsis={{ rows: 1 }} className={styles.ellipsisDesc}>
                    {projectItem.description || '暂无描述'}
                  </Paragraph>
                  {projectItem.status === 'APPROVED' ? (
                    <div className={styles.projects}>
                      {/* 所有的受邀方都通过展示 */}
                      <div className={styles.task}>
                        <div className={styles.titleName}>参与节点</div>
                        <div className={styles.count}>
                          <ProjectNodePopover
                            project={{
                              nodes: [
                                {
                                  nodeId: projectItem.initiatorNodeId,
                                  nodeName: projectItem.initiatorName,
                                },
                                ...(projectItem.nodes || []).filter(
                                  (nodeItem) =>
                                    nodeItem.nodeId !== projectItem.initiatorNodeId,
                                ),
                              ],
                            }}
                            isP2P
                            currentId={nodeId as string}
                          />
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          flex: 1,
                        }}
                      >
                        <div className={styles.titleName}>流程数</div>
                        <span className={styles.count}>
                          <ProjectPipeLinePopover project={projectItem} />
                        </span>
                      </div>
                      <div className={styles.task}>
                        <div className={styles.titleName}>任务数</div>
                        <div className={styles.count}>
                          <ProjectTaskPopover project={projectItem} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.authProjectTagContent}>
                      {/* 有受邀方没有通过 REJECTED  TERMINATED TERMINATED UNAPPROVED APPLIED*/}
                      <AuthProjectTag
                        currentNode={{ id: nodeId as string }}
                        simple={hoverCurrent !== index}
                        project={projectItem}
                      />
                    </div>
                  )}
                  <div className={styles.time}>
                    创建于
                    {projectItem.gmtCreate
                      ? dayjs(Number(projectItem.gmtCreate) * 1000).format(
                          'YYYY-MM-DD HH:mm:ss',
                        )
                      : '--'}
                  </div>
                  <div className={styles.bootom}>
                    <P2pProjectButtons project={projectItem} />
                  </div>
                </div>
              </div>
            );
          },
        )}
      </div>
      <div className={styles['pagination-box']}>
        <Pagination
          showSizeChanger
          total={projectListModel.totalNum || 1}
          current={projectListModel.pageNumber}
          pageSize={projectListModel.pageSize}
          onChange={(page, pageSize) => {
            projectListModel.pageNumber = page;
            projectListModel.pageSize = pageSize;
            projectListModel.getProjectList();
          }}
        />
      </div>
      <P2PCreateProjectModal
        visible={projectListModel.showCreateProjectModel}
        onClose={() => {
          projectListModel.showCreateProjectModel = false;
        }}
        onOk={() => projectListModel.getProjectList()}
      />
      {projectListModel.clickedCooperativeProject && (
        <ConfirmCooperativeNodeModal
          open={projectListModel.showConfirmModal}
          onClose={() => (projectListModel.showConfirmModal = false)}
          confirmStatus={projectListModel.showConfirmStatus}
          data={projectListModel.clickedCooperativeProject}
          onOk={() => projectListModel.getProjectList()}
        />
      )}
    </div>
  );
};
export class ProjectListModel extends Model {
  projectList: API.ConnectivityProject[] = [];
  pageNumber = 1;

  pageSize = 10;

  totalNum = 1;

  loading = false;
  clickedCooperativeProject: API.ConnectivityProject | undefined = undefined;

  showConfirmModal = false;

  showConfirmStatus = 'APPROVED';

  nodeId: string | undefined = undefined;

  onViewMount() {
    const { nodeId } = parse(window.location.search);
    if (nodeId) {
      this.nodeId = nodeId as string;
    }
    this.getProjectList();
  }
  showCreateProjectModel = false;

  handleCreateProject = () => {
    this.showCreateProjectModel = true;
  };

  async getProjectList() {
    // const { nodeId } = parse(window.location.search);
    // if (!nodeId) return;
    this.loading = true;
    try {
      const list = await listP2PProject({
        page_num: this.pageNumber,
        page_size: this.pageSize,
      });
      if (list.status?.code !== 0) {
        throw new Error(list.status?.msg || '项目列表加载失败');
      }
      const page = list.data;
      const records = Array.isArray(page) ? page : page?.records;
      if (!Array.isArray(records)) {
        throw new Error('项目列表响应格式错误');
      }
      this.projectList = records;
      this.totalNum = Array.isArray(page) ? page.length : page?.total ?? 0;
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      this.loading = false;
    }
  }
  async auditProject({
    confirmStatus,
    auditId,
  }: {
    confirmStatus: string;
    auditId: string;
  }) {
    const { status } = await auditConfirmProject({
      audit_id: auditId,
      status: confirmStatus,
    });
    if (status && status.code !== 0) {
      // messageApi.error(status.msg);
      return;
    }

    // onOk();
    // messageApi.success('操作成功!');
  }
}

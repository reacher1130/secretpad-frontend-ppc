import { DatabaseOutlined } from '@ant-design/icons';
import { Divider, Input, Popconfirm, Space, Tag, Tooltip } from 'antd';
import React from 'react';
import { useModel } from '@/util/valtio-helper';
import { CooperativeProjectService } from '../p2p-project-list.service';
import { useLocation } from 'umi';
import styles from './auth-project-tag.less';

interface IProps {
  currentNode: {
    id: string;
    name?: string;
  };
  project: API.ConnectivityProject;
  simple?: boolean;
}
export enum StatusEnum {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TERMINATED = 'TERMINATED',
  APPLIED = 'APPLIED',
  UNAPPROVED = 'UNAPPROVED',
}

export const StatusObj = {
  [StatusEnum.APPROVED]: '已同意',
  [StatusEnum.REJECTED]: '拒绝',
  [StatusEnum.TERMINATED]: '解除',
  [StatusEnum.APPLIED]: '申请中',
  [StatusEnum.UNAPPROVED]: '审批中',
};
export const moveItemToFrontById = (array: API.PartyVoteInfoVO[], id: string) => {
  if (!array) {
    return [];
  }
  const ordered = [...array];
  const index = ordered.findIndex((item) => item.nodeId === id);
  if (index > -1) {
    const [item] = ordered.splice(index, 1);
    ordered.unshift(item);
  }
  return ordered;
};
export const AuthProjectTag = (props: IProps) => {
  const { currentNode, project, simple } = props;
  const { initiatorName, initiatorNodeId: initiator, partyVoteInfos = [], auditId } = project;
  const { pathname } = useLocation();
  const applyList = [
    {
      name: initiatorName,
      id: initiator,
    },
  ];
  const processList = React.useMemo(() => {
    return moveItemToFrontById(partyVoteInfos, currentNode.id).map((item) => ({
      name: item.nodeName,
      id: item.nodeId,
      status: item.action,
      reason: item.reason,
    }));
  }, [project]);
  const currentProcessList = simple ? processList.slice(0, 1) : processList;
  const viewInstance = useModel(CooperativeProjectService);

  return (
    <div className={styles.content}>
      <div className={styles.applyContent}>
        <Space>
          <Tag className={styles.tagApply}>发起</Tag>
          <div className={styles.nodeName}>
            <DatabaseOutlined />
            {applyList[0].name}
          </div>
          {currentNode.id === applyList[0].id && <div>(我的)</div>}
        </Space>
      </div>
      <div>
        {currentProcessList.map((item) => {
          return (
            <div className={styles.processContent} key={item.id}>
              <Space>
                <Tag className={styles.tagProcess}>受邀</Tag>
                <div className={styles.nodeName}>
                  <DatabaseOutlined />
                  {item.name}
                </div>
                {/* 当前项目是待审批状态，且当前节点是本方节点，并且本方节点是待处理状态 */}
                {
                  project.status === 'UNAPPROVED' && currentNode.id === item.id ? (
                    <Space>
                      <div
                        className={styles.agree}
                        onClick={() =>
                          viewInstance.confirmCooperativeProject({
                            audit_id: auditId,
                            status: 'APPROVED',
                          })
                        }
                      >
                        同意
                      </div>
                      <Popconfirm
                        title="你确定要拒绝吗？"
                        placement="left"
                        destroyTooltipOnHide
                        onOpenChange={(open) => {
                          if (!open) {
                            viewInstance.setComment('');
                          }
                        }}
                        description={
                          <Input.TextArea
                            maxLength={50}
                            placeholder="请输50字符以内的理由"
                            allowClear
                            onChange={(e) => viewInstance.setComment(e.target.value)}
                          />
                        }
                        okText="拒绝"
                        cancelText="取消"
                        okButtonProps={{
                          danger: true,
                          ghost: true,
                        }}
                        onConfirm={() =>
                          viewInstance.confirmCooperativeProject({
                            audit_id: auditId,
                            status: 'REJECTED',
                            reason: viewInstance.comment,
                          })
                        }
                      >
                        <div className={styles.reject}>拒绝</div>
                      </Popconfirm>
                      <Divider type="vertical" />
                      <div>{`共${processList.length}方节点`}</div>
                    </Space>
                  ) : (
                    <Space>
                      <Tooltip
                        title={
                          item.status === 'REJECTED'
                            ? item.reason || '暂无原因'
                            : ''
                        }
                      >
                        <div>{`(${StatusObj[project.status as keyof typeof StatusObj]
                          })`}</div>
                      </Tooltip>
                      {currentNode.id === item.id && <div>(我的)</div>}
                    </Space>
                  )
                }
              </Space>
            </div>
          );
        })}
      </div>
    </div>
  )
}

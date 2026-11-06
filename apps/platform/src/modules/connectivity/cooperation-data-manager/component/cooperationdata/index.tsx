import { useEffect, useState, useCallback } from 'react';
import { getModel, Model, useModel } from '@/util/valtio-helper';
import { Select, Button, Popover, Space, Table, Badge, Tooltip, message, Typography, Empty } from 'antd';
import { SearchOutlined, InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import type { FilterValue } from 'antd/es/table/interface';
import type { ColumnsType } from 'antd/es/table';
import type { MessageInstance } from 'antd/es/message/interface';
import { NodeService } from '@/modules/node';
import { formatTimestamp } from '@/modules/dag-result/utils';
import { cooperationDataList, getPublicDataStatus } from '@/services/secretpad/connectivity/CooperationDataController';
import { getNodeApprovedList } from '@/services/secretpad/connectivity/P2PProjectController';
import { DataTableInfoDrawer } from '@/modules/connectivity/my-data-manager/component/data-table-info/data-table-info.view';
import { ApplyDataDrawer } from './apply-data-modal';
import { ApplyHistoryDrawer } from './apply-history-modal';
import styles from './index.less';
const { Option } = Select;

export const CooperationDataComponent = () => {
  const viewInstance = useModel(CooperationDataComponentView);
  const [messageApi, contextHolder] = message.useMessage();
  const [nodeList, setNodeList] = useState<API.NodeRouterVO[] | []>([]);
  const [nodeSelectVal, setNodeSelectVal] = useState('');
  const columns: ColumnsType<API.MyDataListVO> = [
    {
      title: '序号',
      dataIndex: 'index',
      align: 'center',
      render: (_, record, index) => index + 1,
    },
    {
      title: '数据表名',
      dataIndex: 'tableName',
      key: 'tableName',
      align: 'center',
      render: (text: string, tableInfo: API.MyDataListVO) => (
        <Tooltip title={text}>
          <a onClick={() => viewInstance.openDataInfo(tableInfo)}>{text}</a>
        </Tooltip>
      ),
    },
    {
      title: '已授权项目',
      dataIndex: 'authProjects',
      key: 'authProjects',
      align: 'center',
      render: (authProjects: API.AuthProjectVO[]) => {
        const authProjectsFixed = authProjects || [];
        return (
          <div>
            {(authProjectsFixed || [])
              .slice(0, 2)
              .map((i) => i.name)
              .join('、')}
            {authProjectsFixed.length ? ',' : ''}共
            <Popover
              placement="right"
              title="已授权项目"
              content={
                <div className={styles.authProjectListPopover}>
                  {(() => {
                    const projects = authProjectsFixed.map((i) => (
                      <div key={i.name} className={styles.authProjectListPopoverItem}>
                        {i.name}
                      </div>
                    ));
                    return projects.length > 0 ? (
                      projects
                    ) : (
                      <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    );
                  })()}
                </div>
              }
              trigger="hover"
            >
              <a>{authProjectsFixed.length}</a>
            </Popover>
            个项目
          </div>
        );
      },
    },
    {
      title: (
        <Space>
          <div className={styles.uploadText}>状态</div>
          <Tooltip title="数据表状态可能展示不准确,请点击刷新后查看">
            <InfoCircleOutlined className={styles.uploadIcon} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status: string, record: API.MyDataListVO) => {
        return (
          <>
            {status === 'Available' ? (
              <Badge key="green" color="green" text="可用" />
            ) : (
              <Badge key="red" color="red" text="不可用" />
            )}
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={() => {
                viewInstance.refreshTableStatus(record);
              }}
            >
              刷新
            </Button>
          </>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'gmtCreate',
      key: 'gmtCreate',
      align: 'center',
      render: (gmtCreate: number) => (
        <Typography.Text
          ellipsis={{
            tooltip: `${formatTimestamp(String(gmtCreate * 1000))}`,
          }}
        >
          {formatTimestamp(String(gmtCreate * 1000))}
        </Typography.Text>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      fixed: 'right',
      width: 170,
      render: (
        tableInfo: API.MyDataListVO,
      ) => {
        const status = tableInfo.status;
        return (
          <>
            <Space>
              <Tooltip
                title={
                  status !== 'Available' ? '已授权到项目中的数据无法删除' : ''
                }
              >
                <Button
                  type="link"
                  disabled={status !== 'Available'}
                  onClick={() => (viewInstance.openApplyData(tableInfo))}
                >
                  申请
                </Button>
              </Tooltip>
            </Space>
            <Space>
              <Button
                type="link"
                onClick={() => viewInstance.openHistoryDraw(tableInfo)}
              >
                申请记录
              </Button>
            </Space>

          </>
        );
      }
    }
  ];
  useEffect(() => {
    const getNodeList = async () => {
      return await getNodeApprovedList();
    }
    getNodeList().then((res) => {
      const nodeData = (res?.data || []) as API.ConnectivityProject[];
      if (nodeData && nodeData.length) {
        setNodeSelectVal(nodeData[0].contractId as string);
        viewInstance.getPageList({ nodeSelectVal: nodeData[0].contractId as string });
      }
      setNodeList(nodeData);
    })

  }, []);
  return (
    <div className={styles.cooperativeNodeList}>
      <div className={styles.nodeListHeader}>
        <Space size="middle">
          合作方节点：
          <Select
            placeholder="请选择合作节点"
            style={{ width: 200 }}
            value={nodeSelectVal}
          >
            {
              nodeList.map((nodeItem) => {
                return <Option value={nodeItem.contractId} key={nodeItem.contractId}>{nodeItem.name}</Option>
              })
            }
          </Select>
        </Space>
        <Button
          type="primary"
          onClick={() => (viewInstance.getPageList({ nodeSelectVal }))}
        >
          查询
        </Button>
      </div>
      <div className={styles.content}>
        <Table
          scroll={{ x: 'max-content' }}
          loading={viewInstance.loading}
          dataSource={viewInstance.displayTableList}
          columns={columns}
          onChange={(pagination, filters, sorter) => {
            // viewInstance.typeFilters = filters?.datasourceType as FilterValue;
            viewInstance.getPageList();
          }}
          pagination={{
            total: viewInstance.totalNum || 1,
            current: viewInstance.pageNumber,
            pageSize: viewInstance.pageSize,
            onChange: (page, pageSize) => {
              viewInstance.pageNumber = page;
              viewInstance.pageSize = pageSize;
            },
            size: 'default',
            showSizeChanger: true,
          }}
          size="small"
          rowKey={(record) => record.dataset_id as string}
        />
      </div>
      {viewInstance.showDatatableInfoDrawer && (
        <DataTableInfoDrawer
          close={() => {
            viewInstance.showDatatableInfoDrawer = false;
          }}
          visible={viewInstance.showDatatableInfoDrawer}
          data={{
            tableInfo: viewInstance.tableInfo,
            node: { contract_id: viewInstance.contract_id },
            isCooperation: true
          }}
        />
      )}
      <ApplyDataDrawer
        open={viewInstance.showApplyDataDrawer}
        onClose={() => (viewInstance.showApplyDataDrawer = false)}
        // onOk={() => viewInstance.getPageList()}
        data={{
          tableInfo: viewInstance.tableInfo,
          // node: viewInstance.nodeService.currentNode as API.NodeVO,
        }}
      />
      <ApplyHistoryDrawer
        open={viewInstance.showApplyHistoryDrawer}
        onClose={() => (viewInstance.showApplyHistoryDrawer = false)}
        // onOk={() => viewInstance.getPageList()}
        data={{
          tableInfo: viewInstance.tableInfo,
          // node: viewInstance.nodeService.currentNode as API.NodeVO,
        }}
      />
      {contextHolder}
    </div>
  );
}

export class CooperationDataComponentView extends Model {
  pageNumber = 1;

  pageSize = 10;

  totalNum = 1;

  loading = false;

  contract_id = '';

  pageList: API.CooperationDataListVO[] = [];

  displayTableList: API.CooperationDataListVO[] = [];

  showDatatableInfoDrawer = false;

  showApplyDataDrawer = false;

  showApplyHistoryDrawer = false;

  tableInfo: API.MyDataListVO = {
    dataset_id: '',
    name: '',
    datasourceType: ''
  };

  onViewMount() {
    // this.getPageList();
    // if (this.nodeService.currentNode) {
    //   this.getPageList(this.nodeService.currentNode.nodeId as string);
    //   this.currentNode = this.nodeService.currentNode;
    // }
    // this.nodeService.eventEmitter.on((currentNode) => {
    //   this.getPageList(currentNode.nodeId);
    //   this.currentNode = currentNode;
    // });
    // this.datatableInfoService.eventEmitter.on(() => {
    //   this.getPageList();
    // });
  }
  async getPageList(searchObj?: { nodeSelectVal: string }) {
    if (searchObj?.nodeSelectVal) {
      this.contract_id = searchObj?.nodeSelectVal;
      this.pageNumber = 1;
      this.pageSize = 10;
    }
    const list = await cooperationDataList({
      page_num: this.pageNumber,
      page_size: this.pageSize,
      contract_id: this.contract_id,
    });

    this.loading = false;
    this.totalNum = list?.data?.total || 0;
    this.pageList = list?.data?.records || [];
    this.displayTableList = this.pageList;
  }
  refreshTableStatus = async (record: API.MyDataListVO) => {
    try {
      const { status, data } = await getPublicDataStatus({
        contract_id: this.contract_id,
        dataset_id: record.dataset_id,
      });
      if (status?.code === 0) {
        message.success('数据状态刷新成功');
        // TODO: 这里服务端列表状态和这个状态暂时做不到同步，需要手动修改列表状态
        // this.getTableList();
        const newStatus = data?.status;
        const newList = this.displayTableList.map((item) => {
          if (item.dataset_id === record.dataset_id) {
            return {
              ...item,
              status: newStatus,
            };
          }
          return item;
        });
        this.displayTableList = newList;
      } else {
        message.error('数据状态刷新失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  openDataInfo(tableInfo: API.MyDataListVO) {
    this.tableInfo = tableInfo;
    this.showDatatableInfoDrawer = true;
  }

  openApplyData(tableInfo: API.MyDataListVO) {
    this.tableInfo = tableInfo;
    this.showApplyDataDrawer = true;
  }

  openHistoryDraw(tableInfo: API.MyDataListVO) {
    this.tableInfo = tableInfo;
    this.showApplyHistoryDrawer = true;
  }
}

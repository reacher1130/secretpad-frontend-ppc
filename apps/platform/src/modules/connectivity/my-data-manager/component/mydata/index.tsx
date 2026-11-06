import { getModel, Model, useModel } from '@/util/valtio-helper';
import { myDataList, deleteDatatable, getDatatable } from '@/services/secretpad/connectivity/DataController';
import { Empty, Button, Popover, Space, Table, Badge, Tooltip, message, Typography } from 'antd';
import { SearchOutlined, InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import type { FilterValue } from 'antd/es/table/interface';
import type { ColumnsType } from 'antd/es/table';
import type { MessageInstance } from 'antd/es/message/interface';
import { confirmDelete } from '@/components/comfirm-delete';
import styles from './index.less';
import { AddDataDrawer } from './add-data-modal';
import { AuthProjectDrawer } from './auth-project-modal';
import { AuthNodeDrawer } from './auth-node-modal';
import { AuthHistoryDrawer } from './auth-history-modal';
import { DataSourceType } from './my-data.service';
import { NodeService } from '@/modules/node';
import { formatTimestamp } from '@/modules/dag-result/utils';
import { DataTableInfoDrawer } from '@/modules/connectivity/my-data-manager/component/data-table-info/data-table-info.view';


export const MyDataComponent = () => {
  const viewInstance = useModel(MyDataComponentView);
  const [messageApi, contextHolder] = message.useMessage();
  const columns: ColumnsType<API.MyDataListVO> = [
    {
      title: '数据表名',
      dataIndex: 'tableName',
      key: 'tableName',
      align: 'center',
      // width: '15%',
      // ellipsis: true,
      render: (text: string, tableInfo: API.MyDataListVO) => (
        <Tooltip title={text}>
          <a onClick={() => viewInstance.openDataInfo(tableInfo)}>{text}</a>
        </Tooltip>
      ),
    },
    {
      title: '数据类型',
      dataIndex: 'datasourceType',
      key: 'datasourceType',
      align: 'center',
      // width: '15%',
      // ellipsis: true,
      filters: [
        { text: 'OSS', value: DataSourceType.OSS },
        { text: 'HTTP', value: DataSourceType.HTTP },
        { text: 'LOCAL', value: DataSourceType.LOCAL },
      ],
    },
    {
      title: '已授权项目',
      dataIndex: 'authProjects',
      key: 'authProjects',
      align: 'center',
      // width: '15%',
      // ellipsis: true,
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
      align: 'center',
      key: 'status',
      // width: '14%',
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
      // width: '16%',
      // ellipsis: true,
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
      title: '操作',
      key: 'action',
      align: 'center',
      width: 360,
      fixed: 'right',
      render: (
        tableInfo: API.MyDataListVO,
      ) => {
        // const extendProps: any = {};
        // if (index === 0) {
        //   extendProps['ref'] = ref1;
        // }
        const authProjectsFixed = tableInfo.authProjects || [];
        return (
          <div>
            <Space>
              <Tooltip
                title={
                  authProjectsFixed.length > 0 ? '已授权到项目中的数据无法删除' : ''
                }
              >
                <Button
                  type="link"
                  disabled={authProjectsFixed.length > 0}
                  onClick={() => handleDelete(tableInfo)}
                >
                  删除
                </Button>
              </Tooltip>
            </Space>
            <Space>
              <Button
                type="link"
                onClick={() => viewInstance.downLoad(tableInfo)}
              >
                下载
              </Button>
            </Space>
            <Space>
              <Button
                type="link"
                onClick={() => (viewInstance.openAuthProject(tableInfo))}
              >
                授权
              </Button>
            </Space>
            <Space>
              <Button
                type="link"
                onClick={() => (viewInstance.openAuthNode(tableInfo))}
              >
                公开
              </Button>
            </Space>
            <Space>
              <Button
                type="link"
                onClick={() => (viewInstance.openAuthHistory(tableInfo))}
              >
                授权记录
              </Button>
            </Space>
          </div>
        );
      }
    }
  ];
  const handleDelete = (record: API.MyDataListVO) => {
    confirmDelete({
      name: record.name || '',
      description: '',
      onOk: () => {
        viewInstance.deleteData(
          record.tableName || '',
          record.dataset_id || '',
          record.datasourceId || '',
          messageApi,
          record.type,
        );
      },
    });
  };
  return (
    <div className={styles.mydayaList}>
      <div className={styles.header}>
        <Button
          type="primary"
          onClick={() => (viewInstance.showAddDrawer = true)}
        >
          添加数据
        </Button>
      </div>
      <div className={styles.content}>
        <Table
          scroll={{ x: 'max-content' }}
          loading={viewInstance.loading}
          dataSource={viewInstance.displayTableList}
          columns={columns}
          onChange={(pagination, filters, sorter) => {
            viewInstance.typeFilters = filters?.datasourceType as FilterValue;
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
      <AddDataDrawer
        open={viewInstance.showAddDrawer}
        onClose={() => (viewInstance.showAddDrawer = false)}
        onOk={() => viewInstance.getPageList()}
      />
      {viewInstance.showDatatableInfoDrawer && (
        <DataTableInfoDrawer
          close={() => {
            viewInstance.showDatatableInfoDrawer = false;
          }}
          visible={viewInstance.showDatatableInfoDrawer}
          data={{
            tableInfo: viewInstance.tableInfo,
            node: viewInstance.nodeService.currentNode as API.NodeVO,
          }}
        />
      )}
      {/* 授权自己的项目 */}
      <AuthProjectDrawer
        open={viewInstance.showAuthDrawer}
        onClose={() => (viewInstance.showAuthDrawer = false)}
        onOk={() => viewInstance.getPageList()}
        data={{
          tableInfo: viewInstance.tableInfo,
          node: viewInstance.nodeService.currentNode as API.NodeVO,
        }}
      />
      {/* 面向合作节点公开数据 */}
      <AuthNodeDrawer
        open={viewInstance.showOpenDrawer}
        onClose={() => (viewInstance.showOpenDrawer = false)}
        // onOk={() => viewInstance.getPageList()}
        data={{
          tableInfo: viewInstance.tableInfo,
          // node: viewInstance.nodeService.currentNode as API.NodeVO,
        }}
      />
      <AuthHistoryDrawer
        open={viewInstance.showAuthHistoryDrawer}
        onClose={() => (viewInstance.showAuthHistoryDrawer = false)}
        data={{
          tableInfo: viewInstance.tableInfo,
        }}
      />
      {contextHolder}
    </div>
  );
}

export class MyDataComponentView extends Model {

  currentNode: API.NodeVO = {};
  pageNumber = 1;

  pageSize = 10;

  totalNum = 1;

  loading = false;

  showAddDrawer = false;

  showAuthDrawer = false;

  showOpenDrawer = false;

  showDatatableInfoDrawer = false;

  showAuthHistoryDrawer = false;

  tableInfo: API.MyDataListVO = {
    dataset_id: '',
    name: '',
    datasourceType: ''
  };

  pageList: API.MyDataListVO[] = [];
  displayTableList: API.MyDataListVO[] = [];

  typeFilters: FilterValue = [];
  nodeService = getModel(NodeService);
  onViewMount() {
    this.getPageList();
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
  async getPageList() {
    const list = await myDataList({
      pageNum: this.pageNumber,
      pageSize: this.pageSize,
      // search: this.search,
      // sort: this.sortRule,
      // nodeId: nodeId as string,
      types: this.typeFilters,
    });
    this.loading = false;
    this.totalNum = list?.data?.total || 0;
    // BFIA service exposes the canonical camelCase `datasetId` while older
    // connectivity pages address the same row with `dataset_id`.  Normalize
    // at the page boundary so every action (refresh, detail, authorization,
    // download and history) receives a stable identifier, even when a peer
    // adapter omits the compatibility alias.
    this.pageList = (list?.data?.records || []).map((item) => {
      const row = item as API.MyDataListVO & { datasetId?: string };
      return {
        ...row,
        dataset_id: row.dataset_id || row.datasetId,
      };
    });
    this.displayTableList = this.pageList;
  }

  openDataInfo(tableInfo: API.MyDataListVO) {
    this.tableInfo = tableInfo;
    this.showDatatableInfoDrawer = true;
  }

  openAuthNode(tableInfo: API.MyDataListVO) {
    this.tableInfo = tableInfo;
    this.showOpenDrawer = true;
  }

  deleteData = async (
    tableName: string,
    dataset_id: string,
    datasourceId: string,
    messageApi: MessageInstance,
    type: string,
  ) => {
    if (!this.nodeService.currentNode?.nodeId) return;
    const { status } = await deleteDatatable({
      nodeId: this.nodeService.currentNode?.nodeId,
      datatableId: dataset_id,
      datasourceId,
      type,
    });
    if (status && status.code !== 0) {
      messageApi.error(status.msg);
      return;
    }
    messageApi.success(`「${tableName}」删除成功！`);
    this.getPageList();
  };

  refreshTableStatus = async (record: API.MyDataListVO) => {
    try {
      const { status, data } = await getDatatable({
        datatableId: record.dataset_id,
        nodeId: this.nodeService.currentNode?.nodeId,
        type: record.type,
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

  downLoad = async (record: API.MyDataListVO) => {
    message.info('开始下载,请稍等...');
    const token = localStorage.getItem('User-Token') || '';
    fetch(`/api/v1bfia/dataset/download`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'User-Token': token,
      },

      body: JSON.stringify({
        nodeId: this.nodeService.currentNode?.nodeId,
        datasetId: record.dataset_id,
      }),
    }).then((res) =>
      res.blob().then((blob) => {
        const data = new Blob(['\ufeff', blob], { type: 'text/plain;charset=utf-8' });
        const disposition = res.headers.get('Content-Disposition');
        let filename = '';
        const filenameRegex = /filename[^;=\n]*=[^'"]*['"]*((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition || '');
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
        const a = document.createElement('a');
        document.body.appendChild(a); //兼容火狐，将a标签添加到body当中
        const url = window.URL.createObjectURL(data); // 获取 blob 本地文件连接 (blob 为纯二进制对象，不能够直接保存到磁盘上)
        a.href = url;
        a.download = filename;
        a.click();
        a.remove(); //移除a标签
        window.URL.revokeObjectURL(url);
        message.success('下载完成');
      }),
    );
  };

  openAuthProject(tableInfo: API.MyDataListVO) {
    this.tableInfo = tableInfo;
    this.showAuthDrawer = true;
  };

  openAuthHistory(tableInfo: API.MyDataListVO) {
    this.tableInfo = tableInfo;
    this.showAuthHistoryDrawer = true;
  }
}

import {
  SearchOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons';
import { useFullscreen } from 'ahooks';
import type { InputRef } from 'antd';
import { Button, Input, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnType } from 'antd/es/table';
import type { FilterConfirmProps } from 'antd/es/table/interface';
import classNames from 'classnames';
import classnames from 'classnames';
import { groupBy, map as lodashMap } from 'lodash';
import { parse } from 'query-string';
import type { Key } from 'react';
import { useState, useRef, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import { useLocation } from 'umi';

import { Platform, hasAccess } from '@/components/platform-wrapper-connectivity';
import { Download } from '@/modules/dag-result-connectivity/apply-download';
import { openNewTab } from '@/util/path';
import { getModel } from '@/util/valtio-helper';

import { DataSourceType } from '../data-source-list-connectivity/type';
import { ResultManagerService } from '../result-manager-connectivity/result-manager.service';

import styles from './index.less';
import type { DataType, ResultComponentProps } from './types';
import { formatTimestamp } from './utils';

export const ResultZipComponent = (props: ResultComponentProps<'table'>) => {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');

  const [downloadBtnDisabled, setDownloadBtnDisabled] = useState(false);
  const [downloadPath, setDownloadPath] = useState('');
  const searchInput = useRef<InputRef>(null);
  const { pathname } = useLocation();
  const { mode, projectId } = parse(window.location.search);
  const csvRef = useRef<{
    link: HTMLLinkElement;
  }>(null);
  const fullScreenRef = useRef(null);
  const [isFullscreen, { enterFullscreen, exitFullscreen }] =
    useFullscreen(fullScreenRef);
  const downloadData = () => {
    if (csvRef && csvRef.current) {
      csvRef.current.link.click();
    }
  };
  const { data, id } = props;
  const { gmtCreate, meta, jobId, taskId, type: resultType } = data;
  const { rows } = meta;
  const resultManagerService = getModel(ResultManagerService);
  const metaInfo: { path: string; nodeId: string; tableId: string; type: string }[] =
    [];

  useEffect(() => {
    rows.forEach((r) => {
      const { datasourceType, path } = r;

      if (datasourceType === DataSourceType.OSS) {
        setDownloadBtnDisabled(true);
        setDownloadPath(path);
      }
    });
  }, [rows]);

  rows.forEach((r) => {
    const { path, nodeId, fields, fieldTypes, tableId, type } = r;
    metaInfo.push({ path, nodeId, tableId, type });
  });


  return (
    <div className={styles.result}>
      <div className={styles.report}>
        <div className={styles.item}>
          <span className={styles.name}>{id}</span>
          <Tag color="rgba(0,104,250,0.08)">表</Tag>
        </div>
        {/* <div className={styles.item}>
          <span className={styles.timeLabel}>生成时间：</span>
          <span>{formatTimestamp(gmtCreate)}</span>
        </div> */}
        {metaInfo.map((row, index) => {
          const { path, nodeId, tableId, type: nodeType } = row;
          return (
            <div key={`table-${path}-${index}`}>
              <div className={styles.item}>
                <span className={styles.timeLabel}>{nodeId}节点路径：</span>
                <span>{path}</span>
                {/* no download for readtable */}
                {/* 内置节点才展示查看结果跳转 */}
                {/*中心化部署目前互联互通是p2p   guowf15 remark 2024-10-25*/}
                {props.codeName !== 'read_data/datatable' &&
                  nodeType === 'embedded' && (
                    <Button
                      type="link"
                      size="small"
                      style={{ paddingLeft: 20, fontSize: 12 }}
                      onClick={() => {
                        const search = `nodeId=${nodeId}&tab=result&resultName=${tableId}`;
                        openNewTab(pathname, '/node', search);
                      }}
                    >
                      查看结果
                    </Button>
                  )}
                {/* no download for readtable */}
                {/*中心化部署目前互联互通是p2p   guowf15 remark 2024-10-25*/}
                {!hasAccess({ type: [Platform.AUTONOMY] }) &&
                  mode === 'TEE' &&
                  props.codeName !== 'read_data/datatable' && (
                    <Download
                      params={{
                        nodeID: nodeId,
                        taskID: taskId,
                        jobID: jobId,
                        projectID: projectId as string,
                        resourceType: resultType,
                        resourceID: tableId,
                      }}
                    />
                  )}
                {/* p2p 模式下不用申请，直接下载 */}
                {hasAccess({ type: [Platform.AUTONOMY] }) &&
                  props.codeName !== 'read_data/datatable' && (
                    <Tooltip
                      title={
                        downloadBtnDisabled
                          ? `OSS 文件不支持直接下载，请到 OSS 对应 bucket 的预设路径下找到文件下载，地址：${downloadPath}`
                          : ''
                      }
                    >
                      <Button
                        type="link"
                        style={{ paddingLeft: 8, fontSize: 12 }}
                        onClick={() =>
                          resultManagerService.download(nodeId || '', {
                            domainDataId: path,
                          })
                        }
                        disabled={downloadBtnDisabled}
                      >
                        下载
                      </Button>
                    </Tooltip>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import { message } from 'antd';
import request from 'umi-request';

import { Model } from '@/util/valtio-helper';

export interface BfiaResultVO {
  resultId: string;
  projectId: string;
  jobId?: string;
  taskId?: string;
  nodeId?: string;
  kind?: string;
  refId?: string;
  outputUri?: string;
  gmtCreate?: string;
}

export const KindLabelMap: Record<string, string> = {
  table: '表',
  report: '报告',
  rule: '规则',
  model: '模型',
};

export class BfiaResultManagerService extends Model {
  loading = false;

  list: BfiaResultVO[] = [];

  total = 0;

  /** 列出当前节点的 BFIA 结果 (调用独立 bfia_result 表) */
  getResultList = async (nodeId: string) => {
    this.loading = true;
    try {
      const resp = await request<API.SecretPadResponse>('/api/v1bfia/result/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { nodeId },
      });
      if (resp?.status?.code === 0) {
        this.list = resp.data?.records || [];
        this.total = resp.data?.total || 0;
      } else {
        message.error(resp?.status?.msg || '获取结果列表失败');
        this.list = [];
        this.total = 0;
      }
    } catch (e) {
      this.list = [];
      this.total = 0;
    } finally {
      this.loading = false;
    }
  };

  /** 下载结果文件 (复用 BFIA 数据集下载接口) */
  download = async (nodeId: string, record: BfiaResultVO) => {
    message.info('开始下载,请稍等...');
    const token = localStorage.getItem('User-Token') || '';
    fetch(`/api/v1bfia/dataset/downloadOutput`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'User-Token': token,
      },
      body: JSON.stringify({
        nodeId,
        filePath: record.outputUri || record.refId,
      }),
    }).then((res) =>
      res.blob().then((blob) => {
        const data = new Blob(['\ufeff', blob], {
          type: 'text/plain;charset=utf-8',
        });
        const disposition = res.headers.get('Content-Disposition');
        let filename = `${record.resultId}.csv`;
        const filenameRegex =
          /filename[^;=\n]*=[^'"]*['"]*((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition || '');
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
        const a = document.createElement('a');
        document.body.appendChild(a);
        const url = window.URL.createObjectURL(data);
        a.href = url;
        a.download = filename;
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        message.success('下载完成');
      }),
    );
  };
}

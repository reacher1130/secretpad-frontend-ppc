import { message } from 'antd';

import {
  listBfiaComponents,
  listBfiaCompListVO,
} from '@/services/secretpad/BfiaComponentController';
import { Model } from '@/util/valtio-helper';

export type BfiaComponent = {
  name: string;
  domain: string;
  version: string;
  desc: string;
};

export type BfiaCompListVO = {
  name: string;
  version: string;
  desc: string;
  comps: BfiaComponent[];
};

export class BfiaComponentListService extends Model {
  componentList: Record<string, BfiaCompListVO> = {};
  loading = false;

  async getComponentList() {
    this.loading = true;
    try {
      const { data, status } = await listBfiaCompListVO();
      if (data && status?.code === 0) {
        this.componentList = Object.fromEntries(
          Object.entries(data).map(([name, group]) => [
            name,
            {
              ...group,
              comps: group.comps?.map((component) =>
                component.name === 'secureboot'
                  ? {
                      ...component,
                      desc: 'BFIA 画布兼容组件，实际调度 C++ 秘密分享 SS-XGB。上方 SGB 公开样本验证使用 Python 和 Paillier。',
                    }
                  : component,
              ),
            },
          ]),
        );
      } else {
        message.error(status?.msg || '获取BFIA组件列表失败');
      }
    } catch (error) {
      message.error('获取BFIA组件列表失败');
    } finally {
      this.loading = false;
    }
  }

  async getRawComponents() {
    try {
      const { data, status } = await listBfiaComponents();
      if (data && status?.code === 0) {
        return data;
      } else {
        message.error(status?.msg || '获取BFIA组件详情失败');
        return null;
      }
    } catch (error) {
      message.error('获取BFIA组件详情失败');
      return null;
    }
  }
}

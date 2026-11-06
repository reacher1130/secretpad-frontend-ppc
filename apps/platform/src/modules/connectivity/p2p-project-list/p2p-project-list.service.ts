import { message } from 'antd';
import { parse } from 'query-string';
import { Model, getModel } from '@/util/valtio-helper';
import { applyP2pProject, auditConfirmProject } from '@/services/secretpad/connectivity/P2PProjectController';
import { ProjectListModel } from './index';

export class CooperativeProjectService extends Model {
  readonly projectListService;
  constructor() {
    super();
    this.projectListService = getModel(ProjectListModel);
  }
  comment = '';
  /**
   *
   * @param info p2p 模式下申请项目
   * @returns
   */
  applyCooperativeProject = async (info: API.P2pApplyProjectRequest) => {
    return await applyP2pProject(info);
  };
  confirmCooperativeProject = async (info: API.confirmCooperativeProjectRequest) => {
    const res = await auditConfirmProject(info);
    if (res.status?.code !== 0) {
      message.error(res.status?.msg || '审批失败');
      return res;
    }
    message.success('处理成功');
    this.projectListService.getProjectList();
    return res;
  }
  setComment = (value: string) => {
    this.comment = value;
  };
}

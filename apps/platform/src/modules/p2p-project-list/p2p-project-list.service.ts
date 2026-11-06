import { message } from 'antd';

import { isP2PWorkbench } from '@/components/platform-wrapper';
import { LoginService } from '@/modules/login/login.service';
import API from '@/services/secretpad';
import { getModel, Model } from '@/util/valtio-helper';

import type { StatusEnum } from './components/auth-project-tag';

export class P2pProjectListService extends Model {
  readonly loginService = getModel(LoginService);

  projectList: API.ProjectVO[] = [];
  displayProjectList: API.ProjectVO[] = [];
  projectListLoading = false;

  messageGetList: null | (() => Promise<void>) = null;

  comment = '';

  get instId() {
    return this.loginService.userInfo?.ownerId;
  }

  setComment = (value: string) => {
    this.comment = value;
  };

  getListProject = async () => {
    this.projectListLoading = true;
    const { data } = await API.P2PProjectController.listP2PProject();
    this.projectList = (data || []) as API.ProjectVO[];
    this.projectListLoading = false;
    this.displayProjectList = this.projectList.reverse();
    return this.projectList.reverse();
  };
  /**
   * 编辑项目
   */
  projectEdit = async (item: API.ProjectVO, projectId: string) => {
    const params = {
      projectId,
      name: item.projectName as string,
      description: item.description as string,
    };
    message.loading({ content: '更新中', key: item.projectId });
    const { status } = await API.P2PProjectController.updateProject(params);
    if (status && status.code === 0) {
      await this.getListProject();
      message.success('项目名称修改成功');
    }
    message.destroy(item.projectId);
  };

  /**
   * 处理审批
   * @param action c
   * @param id
   */
  process = async (action: StatusEnum, id: string, pathname: string) => {
    const voteParticipantId = this.instId;
    if (!voteParticipantId) {
      message.error('未获取当前机构身份，请刷新后重试');
      return;
    }
    const { status } = await API.MessageController.reply({
      action,
      reason: this.comment,
      voteId: id,
      voteParticipantId,
    });
    if (status && status.code !== 0) {
      message.error(status.msg);
    } else {
      message.success('处理成功');
      this.getListProject();
      if (isP2PWorkbench(pathname)) {
        if (this.messageGetList) {
          await this.messageGetList();
        }
      }
    }
  };

  /**
   * 归档项目  isVote ? 发起审批 : 直接归档
   * - 所有受邀方都同意，就发起审批：所有合作节点同意后才可归档
   * - 有一个没同意，直接归档
   */
  ArchiveProject = async (
    isVote: boolean,
    projectId?: string,
    projectName?: string,
  ) => {
    if (!projectId || !projectName) return;
    if (isVote && !this.instId) {
      message.error('未获取当前机构身份，请刷新后重试');
      return;
    }
    const { status } = await (isVote
      ? API.ApprovalController.create({
          initiatorId: this.instId,
          voteType: 'PROJECT_ARCHIVE',
          voteConfig: {
            projectId: projectId,
          },
        })
      : API.P2PProjectController.projectArchive({
          projectId: projectId,
        }));
    if (status && status.code !== 0) {
      message.error(status.msg);
      return;
    }
    message.success(`「${projectName}」申请归档成功！`);
    this.getListProject();
  };

  // 消息中心传递的callback
  P2pProjectCallBack = (func: () => Promise<void>) => {
    this.messageGetList = func;
  };
}

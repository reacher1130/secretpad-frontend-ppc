import { ArrowLeftOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { Divider, Tabs, Space } from 'antd';
import classnames from 'classnames';
import { parse } from 'query-string';
import { useCallback, useEffect } from 'react';
import { history } from 'umi';

import {
  componentConfigDrawer,
  ComponentConfigDrawer,
} from '@/modules/component-config-connectivity/config-modal';
import { ComponentTree } from '@/modules/component-tree-connectivity/component-tree-view';
import { GraphComponents } from '@/modules/main-dag-connectivity/graph';
import { ToolbarComponent } from '@/modules/main-dag-connectivity/toolbar';
import { ToolbuttonComponent } from '@/modules/main-dag-connectivity/toolbutton';
import { DefaultModalManager } from '@/modules/dag-modal-manager-connectivity';
import { ModalWidth } from '@/modules/dag-modal-manager-connectivity/modal-manger-protocol';
import { ResultDrawer } from '@/modules/dag-result-connectivity/result-modal';
import { RecordListDrawerItem } from '@/modules/pipeline-record-list-connectivity/record-list-drawer-view';
import { ProjectEditService } from '@/modules/layout/header-project-list-connectivity/project-edit.service';
import styles from './index.less';

import { getModel, Model, useModel } from '@/util/valtio-helper';

export const DagLayout = () => {
  const { projectName, flowName } = parse(window.location.search);
  const viewInstance = useModel(DagLayoutView);
  const goBack = () => {
    if (window.localStorage.getItem('flowListUrl')) {
      window.location.href = window.localStorage.getItem('flowListUrl') as string;
    } else {
      history.go(-1);
    }
  }
  useEffect(() => {
    if (window.localStorage.getItem('fisrtJumpToflowListUrlFlag') === '1') {
      window.localStorage.setItem('fisrtJumpToflowListUrlFlag', '');
      window.location.reload();
    }
  }, []);
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.back} onClick={goBack}>
          <ArrowLeftOutlined />
        </span>
        <Divider type="vertical" />
        <span className={styles.title}>项目空间</span>
        <span className={styles.slot}>
          {projectName}-{flowName}
        </span>
      </div>
      <div className={styles.content}>
        <div
          className={classnames(styles.left, {
            [styles.hide]: !viewInstance.leftPanelShow,
          })}
        >
          <div className={styles.leftTop}>
            <ComponentTree />
          </div>
        </div>
        <div
          className={classnames(styles.anchor, {
            [styles.hide]: !viewInstance.leftPanelShow,
          })}
          onClick={() => viewInstance.toggleLeftPanel()}
        />

        <div
          className={classnames(styles.center, {
            [styles.hide]: !viewInstance.leftPanelShow,
          })}
        >
          <div className={styles.toolbar}>
            <ToolbarComponent />
          </div>
          <div className={styles.graph}>
            <GraphComponents />
          </div>
          <div
            className={styles.toolbutton}
            style={{ right: viewInstance.rightModalSize }}
          >
            {/* 放大缩小 */}
            <ToolbuttonComponent />
          </div>
        </div>
      </div>
      {/* 悬浮样本表执行结果 */}
      <ResultDrawer />
      <ComponentConfigDrawer />
    </div>
  )
}

const RIGHT_DIST = 20;
export class DagLayoutView extends Model {
  modalManager = getModel(DefaultModalManager);
  projectEditService = getModel(ProjectEditService);
  constructor() {
    super();
    this.modalManager.onModalsChanged(() => {
      const status = this.modalManager.modals;
      if (
        status[componentConfigDrawer.id].visible &&
        status[RecordListDrawerItem.id].visible
      ) {
        return (this.rightModalSize =
          ModalWidth[componentConfigDrawer.id] +
          ModalWidth[RecordListDrawerItem.id] +
          RIGHT_DIST);
      }
      if (status[RecordListDrawerItem.id].visible) {
        return (this.rightModalSize = ModalWidth[RecordListDrawerItem.id] + RIGHT_DIST);
      }
      if (status[componentConfigDrawer.id].visible) {
        return (this.rightModalSize =
          ModalWidth[componentConfigDrawer.id] + RIGHT_DIST);
      }

      if (
        !status[componentConfigDrawer.id].visible &&
        !status[RecordListDrawerItem.id].visible
      ) {
        return (this.rightModalSize = RIGHT_DIST);
      }
    });
  }

  leftPanelShow = true;

  rightModalSize = RIGHT_DIST;

  onViewMount() {
    this.changePipelineCanEdit();
  }
  toggleLeftPanel() {
    this.leftPanelShow = !this.leftPanelShow;
  }
  changePipelineCanEdit = () => {
    const { ownerId, nodeId, isDraft, dagId } = parse(window.location.search);
    if (!ownerId || !nodeId || !dagId || (isDraft != '0')) {
      this.projectEditService.changeCanEditTrue();
      this.projectEditService.changeCanEdit({
        runAllToolTip: '',
      });
      if (isDraft == '1') {
        this.projectEditService.changeCanEdit({
          runAllToolTip: '',
          toolbarDisabled: false,
        });
      }
    } else {
      if (dagId && ownerId !== nodeId) {
        this.projectEditService.changeCanEditTrue();
        this.projectEditService.changeCanEdit({
          createPipelineDisabled: false,
          pipelineEditDisabled: false,
          runAllToolTip: '非我方节点创建，仅可查看',
          submitModelDisabled: false,
        });
      } else {
        this.projectEditService.changeCanEditFalse();
      }
    }
  }
}

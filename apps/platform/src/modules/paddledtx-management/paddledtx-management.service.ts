import { message } from 'antd';

import {
  getPaddleDtxStatus,
  getPaddleDtxTask,
  listPaddleDtxTasks,
  startPaddleDtxTask,
  submitPaddleDtxTask,
} from '@/services/secretpad/PaddleDtxController';
import type { PaddleDtxTask } from '@/services/secretpad/PaddleDtxController';
import { Model } from '@/util/valtio-helper';

export class PaddleDtxManagementService extends Model {
  status: Record<string, any> = {};
  lastTask: Record<string, any> | null = null;
  loading = false;
  submitting = false;
  tasks: PaddleDtxTask[] = [];
  selectedTaskId = '';
  taskError = '';
  listError = '';
  tasksLoading = false;
  starting = false;
  private taskRequest = 0;

  async loadTasks() {
    this.tasksLoading = true;
    try {
      const { data, status } = await listPaddleDtxTasks();
      if (status?.code !== 0 || !data)
        throw new Error(status?.msg || '获取任务列表失败');
      this.tasks = data.tasks || [];
      this.listError = '';
    } catch (error) {
      this.listError = (error as Error).message || '获取任务列表失败';
    } finally {
      this.tasksLoading = false;
    }
  }

  async loadTask(taskId: string) {
    const requestId = ++this.taskRequest;
    if (this.selectedTaskId !== taskId) this.lastTask = null;
    this.selectedTaskId = taskId;
    try {
      const { data, status } = await getPaddleDtxTask(taskId);
      if (this.selectedTaskId !== taskId || requestId !== this.taskRequest) return;
      if (status?.code !== 0 || !data) throw new Error(status?.msg || '查询任务失败');
      this.lastTask = data;
      this.taskError = data.error || '';
    } catch (error) {
      if (this.selectedTaskId === taskId && requestId === this.taskRequest) {
        this.taskError = (error as Error).message || '查询任务失败';
      }
    }
  }

  async startTask(taskId: string) {
    if (this.starting) return;
    const requestId = ++this.taskRequest;
    this.starting = true;
    try {
      const { data, status } = await startPaddleDtxTask(taskId);
      if (status?.code !== 0 || !data) throw new Error(status?.msg || '启动任务失败');
      if (this.selectedTaskId === taskId && requestId === this.taskRequest) {
        this.lastTask = data;
        this.taskError = data.error || '';
      }
      await this.loadTasks();
    } catch (error) {
      if (this.selectedTaskId === taskId && requestId === this.taskRequest) {
        this.taskError = (error as Error).message;
      }
    } finally {
      this.starting = false;
    }
  }

  async loadStatus() {
    this.loading = true;
    try {
      const { data, status } = await getPaddleDtxStatus();
      if (status?.code === 0 && data) {
        this.status = data;
      } else {
        this.status = { error: status?.msg || '获取链桨状态失败' };
        message.error(this.status.error);
      }
    } catch (error) {
      this.status = { error: (error as Error).message || '无法连接计算环境' };
    } finally {
      this.loading = false;
    }
  }

  async submitTask(values: Record<string, any>) {
    this.submitting = true;
    try {
      const { data, status } = await submitPaddleDtxTask(values);
      if (status?.code === 0 && data?.taskId) {
        this.selectedTaskId = data.taskId;
        this.lastTask = data;
        this.taskError = data.error || '';
        message.success(`链桨任务已发布：${data.taskId}`);
        return true;
      }
      message.error(status?.msg || '链桨任务提交失败');
      return false;
    } catch (error) {
      message.error((error as Error).message || '计算任务提交失败');
      return false;
    } finally {
      this.submitting = false;
    }
  }
}

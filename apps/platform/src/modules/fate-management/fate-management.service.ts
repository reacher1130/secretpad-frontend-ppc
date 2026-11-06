import { message } from 'antd';
import { Model } from '@/util/valtio-helper';
import {
  createFateCluster,
  updateFateCluster,
  deleteFateCluster,
  listFateClusters,
} from '@/services/secretpad/FateClusterController';
import {
  submitFateJob,
  stopFateJob,
  listFateJobs,
} from '@/services/secretpad/FateJobController';
import {
  createFateDataset,
  updateFateDataset,
  deleteFateDataset,
  listFateDatasets,
} from '@/services/secretpad/FateDatasetController';
import {
  createFateModel,
  updateFateModel,
  deleteFateModel,
  listFateModels,
} from '@/services/secretpad/FateModelController';

export class FateManagementService extends Model {
  clusters: API.FateClusterVO[] = [];
  jobs: API.FateJobVO[] = [];
  datasets: API.FateDatasetVO[] = [];
  models: API.FateModelVO[] = [];
  currentClusterId?: string;
  loading = false;
  submitting = false;
  private jobsRequest = 0;
  private datasetsRequest = 0;
  private modelsRequest = 0;

  private get defaultClusterId() {
    return this.currentClusterId || this.clusters[0]?.clusterId;
  }

  async loadClusters() {
    this.loading = true;
    try {
      const { data, status } = await listFateClusters();
      if (status?.code === 0 && data) {
        this.clusters = data;
        if (data.length > 0 && !this.currentClusterId) {
          this.currentClusterId = data[0].clusterId;
          // 默认加载第一个集群的关联数据
          await this.loadJobs(this.currentClusterId);
          await this.loadDatasets(this.currentClusterId);
          await this.loadModels(this.currentClusterId);
        }
      } else {
        message.error(status?.msg || '获取 FATE 集群失败');
      }
    } finally {
      this.loading = false;
    }
  }

  async saveCluster(values: API.FateClusterRequest, clusterId?: string) {
    this.submitting = true;
    try {
      const { data, status } = clusterId
        ? await updateFateCluster({ clusterId }, values)
        : await createFateCluster(values);
      if (status?.code === 0 && data) {
        message.success(clusterId ? '更新成功' : '创建成功');
        await this.loadClusters();
        return true;
      }
      message.error(status?.msg || '保存失败');
      return false;
    } finally {
      this.submitting = false;
    }
  }

  async removeCluster(clusterId: string) {
    const { status } = await deleteFateCluster({ clusterId });
    if (status?.code === 0) {
      message.success('删除成功');
      await this.loadClusters();
      return true;
    }
    message.error(status?.msg || '删除失败');
    return false;
  }

  async loadJobs(clusterId?: string, quiet = false) {
    const requestId = ++this.jobsRequest;
    if (!quiet) this.loading = true;
    try {
      const effectiveClusterId = clusterId || this.defaultClusterId;
      if (!effectiveClusterId) return;
      const { data, status } = await listFateJobs(
        effectiveClusterId ? { clusterId: effectiveClusterId } : {},
      );
      if (requestId !== this.jobsRequest || effectiveClusterId !== this.defaultClusterId) return;
      if (status?.code === 0 && data) {
        this.jobs = data;
      } else if (!quiet) {
        message.error(status?.msg || '获取 FATE 作业失败');
      }
    } finally {
      if (!quiet) this.loading = false;
    }
  }

  async submitJob(values: API.FateJobRequest) {
    this.submitting = true;
    try {
      const { data, status } = await submitFateJob(values);
      if (status?.code === 0 && data) {
        message.success('作业提交成功');
        await this.loadJobs(values.clusterId || undefined);
        return true;
      }
      message.error(status?.msg || '作业提交失败');
      return false;
    } finally {
      this.submitting = false;
    }
  }

  async stopJob(jobId: string, clusterId?: string) {
    const { status } = await stopFateJob({ jobId });
    if (status?.code === 0) {
      message.success('停止成功');
      await this.loadJobs(clusterId);
      return true;
    }
    message.error(status?.msg || '停止失败');
    return false;
  }

  async loadDatasets(clusterId?: string) {
    const requestId = ++this.datasetsRequest;
    this.loading = true;
    try {
      const effectiveClusterId = clusterId || this.defaultClusterId;
      if (!effectiveClusterId) return;
      const { data, status } = await listFateDatasets(
        effectiveClusterId ? { clusterId: effectiveClusterId } : {},
      );
      if (requestId !== this.datasetsRequest || effectiveClusterId !== this.defaultClusterId) return;
      if (status?.code === 0 && data) {
        this.datasets = data;
      } else {
        message.error(status?.msg || '获取 FATE 数据集失败');
      }
    } finally {
      this.loading = false;
    }
  }

  async saveDataset(values: API.FateDatasetRequest, datasetId?: string) {
    this.submitting = true;
    try {
      const { data, status } = datasetId
        ? await updateFateDataset({ datasetId }, values)
        : await createFateDataset(values);
      if (status?.code === 0 && data) {
        message.success(datasetId ? '更新成功' : '创建成功');
        await this.loadDatasets(values.clusterId || undefined);
        return true;
      }
      message.error(status?.msg || '保存失败');
      return false;
    } finally {
      this.submitting = false;
    }
  }

  async removeDataset(datasetId: string, clusterId?: string) {
    const { status } = await deleteFateDataset({ datasetId });
    if (status?.code === 0) {
      message.success('删除成功');
      await this.loadDatasets(clusterId);
      return true;
    }
    message.error(status?.msg || '删除失败');
    return false;
  }

  async loadModels(clusterId?: string) {
    const requestId = ++this.modelsRequest;
    this.loading = true;
    try {
      const effectiveClusterId = clusterId || this.defaultClusterId;
      if (!effectiveClusterId) return;
      const { data, status } = await listFateModels(
        effectiveClusterId ? { clusterId: effectiveClusterId } : {},
      );
      if (requestId !== this.modelsRequest || effectiveClusterId !== this.defaultClusterId) return;
      if (status?.code === 0 && data) {
        this.models = data;
      } else {
        message.error(status?.msg || '获取 FATE 模型失败');
      }
    } finally {
      this.loading = false;
    }
  }

  async saveModel(values: API.FateModelRequest, modelId?: string) {
    this.submitting = true;
    try {
      const { data, status } = modelId
        ? await updateFateModel({ modelId }, values)
        : await createFateModel(values);
      if (status?.code === 0 && data) {
        message.success(modelId ? '更新成功' : '创建成功');
        await this.loadModels(values.clusterId || this.currentClusterId);
        return true;
      }
      message.error(status?.msg || '保存失败');
      return false;
    } finally {
      this.submitting = false;
    }
  }

  async removeModel(modelId: string, clusterId?: string) {
    const { status } = await deleteFateModel({ modelId });
    if (status?.code === 0) {
      message.success('删除成功');
      await this.loadModels(clusterId || this.currentClusterId);
      return true;
    }
    message.error(status?.msg || '删除失败');
    return false;
  }
}

import { Model, getModel } from '@/util/valtio-helper';
import { createFlow } from '@/services/secretpad/connectivity/FlowController';

export class AddFlowService extends Model {
  addFlow = async (value: API.CreatFlowRequest) => {
    const params: API.CreatFlowRequest = {
      projectId: value.projectId,
      name: value.name,
    };
    if (value.description !== undefined) {
      params.description = value.description;
    }
    return await createFlow(params);
  };
}

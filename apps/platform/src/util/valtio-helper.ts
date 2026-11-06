import { useLayoutEffect } from 'react';
import { proxy, useSnapshot } from 'valtio';

class Model {
  constructor() {
    return proxy(this);
  }

  onViewMount() {
    return;
  }

  onViewUnMount() {
    return;
  }
}

const ModelMap = new WeakMap();

type Newable<T = any> = new (...args: any[]) => T;

const getModel = function <T extends Newable>(model: T) {
  let modelInstance = ModelMap.get(model);
  if (!modelInstance) {
    modelInstance = new model();
    ModelMap.set(model, modelInstance);
  }

  return modelInstance as InstanceType<T>;
};

const useModel = function <T extends Newable>(model: T) {
  const modelInstance = getModel(model);

  useLayoutEffect(() => {
    modelInstance.onViewMount();

    return () => {
      modelInstance.onViewUnMount();
    };
  }, []);

  useSnapshot(modelInstance);
  return modelInstance as InstanceType<T>;
};

export { Model, useModel, getModel };

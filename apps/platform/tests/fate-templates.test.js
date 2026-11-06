const {
  buildFateTemplate,
  parseFateJson,
  templateDatasetOptions,
} = require('../src/modules/fate-management/job-templates');

const bindings = {
  guestPartyId: ' JG0100001100000010 ',
  hostPartyId: 'JG0100001100000000',
  guestDatasetRef: 'experiment#breast_hetero_guest',
  hostDatasetRef: 'experiment#breast_hetero_host',
  epochs: 2,
};

test('PSI binds both native parties and registered tables without adding a training task', () => {
  const { dag, config } = buildFateTemplate('psi', bindings);
  expect(dag.components).toHaveLength(1);
  expect(dag.components[0]).toMatchObject({
    name: 'psi_0',
    componentName: 'psi',
    input: [],
    parameter: { protocol: 'ecdh_psi', curve_type: 'curve25519' },
  });
  expect(config.initiator.party_id).toBe('JG0100001100000010');
  expect(config.role).toEqual({
    guest: ['JG0100001100000010'],
    host: ['JG0100001100000000'],
    arbiter: [],
  });
  expect(config.task_params.guest['0'].psi_0.dataset_id).toBe(bindings.guestDatasetRef);
  expect(config.task_params.host['0'].psi_0.dataset_id).toBe(bindings.hostDatasetRef);
  expect(config.task_params.common).toBeUndefined();
});

test('LR consumes the PSI output and keeps edited epochs consistent in DAG and config', () => {
  const { dag, config } = buildFateTemplate('psi-lr', {
    ...bindings,
    epochs: 7,
    guestPartyId: 'guest-123',
  });
  expect(dag.components[1].input).toEqual([{ key: 'psi_0.data', type: 'dataset' }]);
  expect(dag.components[1].parameter.epochs).toBe(7);
  expect(config.task_params.common.coordinated_lr_1.epochs).toBe(7);
  expect(config.role.guest).toEqual(['guest-123']);
  const other = buildFateTemplate('psi-lr', bindings);
  dag.components[0].parameter.curve_type = 'changed';
  expect(other.dag.components[0].parameter.curve_type).toBe('curve25519');
  expect(other.config.task_params.common.coordinated_lr_1.epochs).toBe(2);
});

test.each([
  { guestPartyId: 'alice' },
  { hostPartyId: '' },
  { guestDatasetRef: '' },
  { hostDatasetRef: 'table-without-namespace' },
  { epochs: 0 },
  { epochs: 1.5 },
])('rejects an incomplete or incompatible template binding: %j', (override) => {
  expect(() => buildFateTemplate('psi-lr', { ...bindings, ...override })).toThrow();
});

test('dataset options cannot cross cluster or role boundaries', () => {
  const guest = {
    clusterId: 'A',
    role: 'Guest',
    datasetId: 'a',
    namespace: 'ns',
    tableName: 'guest',
  };
  const candidates = [
    guest,
    { ...guest, clusterId: 'B' },
    { ...guest, role: 'host' },
    { ...guest, role: undefined },
    { ...guest, tableName: '' },
  ];
  expect(templateDatasetOptions(candidates, 'A', 'guest')).toEqual([guest]);
  expect(templateDatasetOptions(candidates, undefined, 'guest')).toEqual([]);
});

test.each(['{', 'null', '[]', '"text"'])(
  'invalid advanced JSON gives a readable validation error: %s',
  (value) => {
    expect(() => parseFateJson(value, 'DAG')).toThrow('DAG');
  },
);

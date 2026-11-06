const { parse } = require('query-string');
const {
  protocolHome,
  legacyProtocolHome,
  normalizeMenuSearch,
} = require('../src/modules/protocol-navigation/navigation');

const query = (url) => parse(url.split('?')[1] || url);

test.each([
  ['secretflow', 'workbench'],
  ['bfia', 'workbench'],
  ['fate', 'fate-management'],
  ['paddledtx', 'paddledtx-management'],
])(
  'switching to %s resets project context and preserves node identity',
  (protocol, tab) => {
    const url = protocolHome(
      protocol,
      '?ownerId=alice%26test&nodeId=alice&tab=connectivity-my-project&tabComponent=flow&projectId=old',
    );
    expect(url.startsWith('/edge?')).toBe(true);
    expect(query(url)).toEqual({ ownerId: 'alice&test', nodeId: 'alice', tab });
  },
);

test('a BFIA flow bookmark stays in its project after moving to the main platform', () => {
  const url = legacyProtocolHome(
    '/protocol/bfia',
    '?ownerId=alice&tab=workbench&tabComponent=flow&projectId=p1&projectName=A%26B',
  );
  expect(url.startsWith('/edge?')).toBe(true);
  expect(query(url)).toEqual({
    ownerId: 'alice',
    tab: 'connectivity-my-project',
    tabComponent: 'flow',
    projectId: 'p1',
    projectName: 'A&B',
  });
});

test('an old protocol bookmark cannot leave a blank page under a different active protocol', () => {
  const url = legacyProtocolHome('/protocol/fate', '?ownerId=alice');
  const normalized = normalizeMenuSearch(
    url.split('?')[1],
    [{ key: 'workbench' }],
    'workbench',
  );
  expect(query(normalized)).toEqual({ ownerId: 'alice', tab: 'workbench' });
});

test('refresh preserves valid flow metadata and nested data menu selections without an ownerId', () => {
  const menus = [
    { key: 'connectivity-my-project' },
    { key: 'data', children: [{ key: 'partner-data' }] },
  ];
  const flow =
    'nodeId=alice&tab=connectivity-my-project&tabComponent=flow&projectId=p1';
  expect(query(normalizeMenuSearch(flow, menus, 'workbench'))).toEqual(parse(flow));
  expect(query(normalizeMenuSearch('tab=partner-data', menus, 'workbench'))).toEqual({
    tab: 'partner-data',
  });
});

test('incompatible tabs discard stale flow parameters before rendering the new default', () => {
  const result = normalizeMenuSearch(
    'ownerId=alice&tab=connectivity-my-project&tabComponent=flow&projectId=p1',
    [{ key: 'fate-management' }],
    'fate-management',
  );
  expect(query(result)).toEqual({ ownerId: 'alice', tab: 'fate-management' });
});

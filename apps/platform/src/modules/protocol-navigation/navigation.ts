import { parse, stringify } from 'query-string';

export const protocolDefaultTabs: Record<API.PrivacyProtocol, string> = {
  secretflow: 'workbench',
  bfia: 'workbench',
  fate: 'fate-management',
  paddledtx: 'paddledtx-management',
};

export const protocolHome = (protocol: API.PrivacyProtocol, search: string) => {
  const { ownerId, nodeId } = parse(search);
  return `/edge?${stringify({ ownerId, nodeId, tab: protocolDefaultTabs[protocol] })}`;
};

// A bookmark selects a page, never changes the server's running protocol.
export const legacyProtocolHome = (pathname: string, search: string) => {
  const protocol = pathname.split('/').pop() as API.PrivacyProtocol;
  const params = parse(search);
  const tab =
    protocol === 'bfia' && params.tabComponent === 'flow'
      ? 'connectivity-my-project'
      : params.tab || protocolDefaultTabs[protocol] || 'workbench';
  return `/edge?${stringify({ ...params, tab })}`;
};

type NavigationItem = { key: string; children?: NavigationItem[] };

export const normalizeMenuSearch = (
  search: string,
  items: NavigationItem[],
  defaultTab?: string,
) => {
  const params = parse(search);
  const contains = (menus: NavigationItem[]): boolean =>
    menus.some(
      (item) => item.key === params.tab || (item.children && contains(item.children)),
    );
  // Keep valid project/flow deep links, but discard context from another protocol.
  return contains(items)
    ? stringify(params)
    : stringify({ ownerId: params.ownerId, nodeId: params.nodeId, tab: defaultTab });
};

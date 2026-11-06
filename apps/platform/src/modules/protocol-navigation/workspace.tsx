import {
  CheckOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Portal, ShowMenuContext } from '@secretflow/dag';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import { parse, stringify } from 'query-string';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { history, useLocation } from 'umi';

import { ReactComponent as PlatformMark } from '@/assets/platform-mark.svg';
import { DefaultModalManager } from '@/modules/dag-modal-manager';
import { useModel } from '@/util/valtio-helper';

import { normalizeMenuSearch, protocolDefaultTabs, protocolHome } from './navigation';
import { protocolProfiles } from './profiles';
import styles from './workspace.less';

export type WorkspaceMenuItem = {
  label: string;
  key: string;
  icon: ReactNode;
  component: ReactNode;
  children?: WorkspaceMenuItem[];
};

const toMenuItems = (items: WorkspaceMenuItem[]): MenuProps['items'] =>
  items.map(({ key, label, icon, children }) => ({
    key,
    label,
    icon,
    ...(children ? { children: toMenuItems(children) } : {}),
  }));

const findItem = (
  items: WorkspaceMenuItem[],
  key?: string,
): WorkspaceMenuItem | undefined => {
  for (const item of items) {
    if (item.key === key) return item;
    const child = item.children && findItem(item.children, key);
    if (child) return child;
  }
  return undefined;
};

export const ProtocolWorkspace = ({
  protocol,
  supportedProtocols,
  canSwitch,
  switching,
  menuItems,
  onSwitch,
}: {
  protocol: API.PrivacyProtocol;
  supportedProtocols: API.PrivacyProtocol[];
  canSwitch: boolean;
  switching: boolean;
  menuItems: WorkspaceMenuItem[];
  onSwitch: (protocol: API.PrivacyProtocol) => void;
}) => {
  const { search } = useLocation();
  const modalManager = useModel(DefaultModalManager);
  const profile = protocolProfiles[protocol];
  const X6ReactPortalProvider = Portal.getProvider();
  const normalized = normalizeMenuSearch(
    search,
    menuItems,
    protocolDefaultTabs[protocol],
  );
  const { tab, ownerId, nodeId } = parse(normalized) as {
    tab: string;
    ownerId?: string;
    nodeId?: string;
  };
  const page = findItem(menuItems, tab);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(
    () => window.matchMedia('(max-width: 1024px)').matches,
  );
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)');
    const resize = () => setCollapsed(media.matches);
    media.addEventListener('change', resize);
    return () => media.removeEventListener('change', resize);
  }, []);
  useEffect(() => {
    if (stringify(parse(search)) !== normalized) history.replace(`/edge?${normalized}`);
  }, [search, normalized]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [tab, protocol]);
  const navigate = (key: string) => {
    modalManager.closeAllModals();
    history.replace(`/edge?${stringify({ ownerId, nodeId, tab: key })}`);
  };
  return (
    <div
      className={styles.workspace}
      data-protocol-workspace={protocol}
      style={
        {
          '--workspace-accent': profile.color,
          '--workspace-soft': profile.soft,
        } as CSSProperties
      }
    >
      <ShowMenuContext.Provider value={false}>
        <X6ReactPortalProvider />
      </ShowMenuContext.Provider>
      <header className={styles.topbar}>
        <button
          className={styles.brand}
          type="button"
          aria-label="开放互联平台首页"
          onClick={() => history.replace(protocolHome(protocol, search))}
        >
          <PlatformMark viewBox="0 0 64 64" aria-hidden="true" />
          <span>
            <strong>开放互联平台</strong>
            <small>PRIVACY · CONNECT · CREATE</small>
          </span>
        </button>
        <nav className={styles.protocolNav} aria-label="切换计算协议">
          {(canSwitch ? supportedProtocols : [protocol]).map((item) => (
            <button
              key={item}
              type="button"
              className={styles.protocolButton}
              data-active={item === protocol}
              aria-pressed={item === protocol}
              aria-label={`切换到${protocolProfiles[item].label}协议`}
              disabled={switching}
              onClick={() => item !== protocol && onSwitch(item)}
            >
              <span className={styles.protocolMonogram}>
                {protocolProfiles[item].label === '隐语'
                  ? 'SF'
                  : item === 'paddledtx'
                  ? 'DTX'
                  : protocolProfiles[item].label}
              </span>
              <span>
                <strong>{protocolProfiles[item].label}</strong>
                <small>{protocolProfiles[item].caption}</small>
              </span>
              {item === protocol && <CheckOutlined className={styles.protocolCheck} />}
            </button>
          ))}
        </nav>
        <div className={styles.identity}>
          <span>
            {String(ownerId || nodeId || 'N')
              .slice(0, 1)
              .toUpperCase()}
          </span>
          <div>
            <strong>{ownerId || nodeId || '当前节点'}</strong>
            <small>本方节点</small>
          </div>
        </div>
      </header>
      <div className={styles.body} data-collapsed={collapsed}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCaption}>
            <span className={styles.activeDot} />
            <span>{profile.label} 工作空间</span>
          </div>
          <div className={styles.menuScroll}>
            <Menu
              theme="dark"
              mode="inline"
              inlineCollapsed={collapsed}
              selectedKeys={[tab]}
              defaultOpenKeys={menuItems
                .filter((item) => item.children?.some((child) => child.key === tab))
                .map((item) => item.key)}
              items={toMenuItems(menuItems)}
              onSelect={({ key }) => navigate(key)}
            />
          </div>
          <div className={styles.sidebarFooter}>
            <div className={styles.workspaceNote}>
              <span>连接数据的价值</span>
              <small>让协作发生，让隐私留在原地。</small>
            </div>
            <button
              type="button"
              aria-label={collapsed ? '展开导航菜单' : '收起导航菜单'}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              <span>收起导航</span>
            </button>
          </div>
        </aside>
        <main className={styles.main} aria-busy={switching}>
          <div className={styles.scrollArea} ref={scrollRef}>
            <div className={styles.breadcrumb}>
              <span>工作空间</span>
              <span>/</span>
              <strong>{page?.label}</strong>
              <span className={styles.protocolBadge}>{profile.label} 协议</span>
            </div>
            <section
              className={styles.hero}
              key={protocol}
              aria-label="当前协议工作空间"
            >
              <div className={styles.heroCopy}>
                <div className={styles.eyebrow}>{profile.category}</div>
                <h1>
                  {tab === protocolDefaultTabs[protocol] ? profile.title : page?.label}
                </h1>
                <p>{profile.description}</p>
                <div className={styles.heroMeta}>
                  <span>{profile.mode}</span>
                  <span>
                    协作对象 · {((protocol === 'secretflow' && (ownerId || nodeId) === 'kimi') ||
                      (protocol === 'bfia' && (ownerId || nodeId) === 'bob')) ? 'Alice' : profile.peer}
                  </span>
                </div>
              </div>
              <div className={styles.heroArt} aria-hidden="true">
                <div className={styles.orbit} />
                <div className={styles.orbitInner} />
                <span className={styles.nodeLeft}>A</span>
                <span className={styles.nodeRight}>
                  {protocol === 'bfia' ? 'B' : protocol === 'secretflow' ? 'K' : '∞'}
                </span>
                <div className={styles.linkCore}>
                  <SwapOutlined />
                </div>
                <span className={styles.routeLine} />
              </div>
            </section>
            <div className={styles.pageContent} key={`${protocol}-${tab}`}>
              {page?.component}
            </div>
            <footer className={styles.pageFooter}>
              <span>隐私计算开放互联平台</span>
              <span>
                {profile.label} · {page?.label}
              </span>
            </footer>
          </div>
          {switching && (
            <div className={styles.switchingOverlay} role="status">
              <div className={styles.switchingIcon}>
                <SwapOutlined spin />
              </div>
              <strong>正在准备计算环境</strong>
              <span>完成后将自动更新菜单与工作空间</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

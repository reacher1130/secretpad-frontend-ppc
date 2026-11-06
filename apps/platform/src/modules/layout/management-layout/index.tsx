import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useKeyPress } from 'ahooks';
import { Menu } from 'antd';
import classnames from 'classnames';
import { parse, stringify } from 'query-string';
import { useEffect, useState } from 'react';
import { history, useLocation } from 'umi';

import { ReactComponent as Logo } from '@/assets/logo-compact.svg';
import { DefaultModalManager } from '@/modules/dag-modal-manager';
import { normalizeMenuSearch } from '@/modules/protocol-navigation/navigation';
import { isWindows } from '@/util/platform';

import { useModel } from '@/util/valtio-helper';

import styles from './index.less';

/**
 * BFIA connectivity sub-component type rendered inside a management-layout tab.
 * When the URL contains `tabComponent=flow`, the layout should render the
 * project's flow list instead of the default project-list component.
 */
export enum tabComponentType {
  FLOW = 'flow',
}

type MenuItem = {
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  key: string;
  children?: MenuItem[];
};

type ManagementLayoutComponentProps = {
  menuItems: MenuItem[];
  defaultTabKey?: string;
  /** 侧边栏 Logo 下方、菜单上方的额外区域（如协议切换器） */
  siderTopExtra?: React.ReactNode;
};

// 递归查找菜单（含子菜单）对应的 component，修复带 children 的 BFIA 菜单子项无法渲染的问题
const findMenuComponent = (
  items: MenuItem[],
  key?: string,
): React.ReactNode | undefined => {
  for (const item of items) {
    if (item.key === key) return item.component;
    if (item.children) {
      const found = findMenuComponent(item.children, key);
      if (found !== undefined) return found;
    }
  }
  return undefined;
};

export const foldHotKey = {
  key: isWindows ? 'ctrl.uparrow' : 'meta.ctrl.uparrow',
  text: isWindows ? 'Ctrl + ↑' : '⌘ + ctrl + ↑ ',
};

export const ManagementLayoutComponent = (props: ManagementLayoutComponentProps) => {
  const modalManager = useModel(DefaultModalManager);

  const { menuItems, defaultTabKey, siderTopExtra } = props;
  const [collapsed, setCollapsed] = useState(false);

  const { pathname, search } = useLocation();
  const normalizedSearch = normalizeMenuSearch(search, menuItems, defaultTabKey);
  const {
    tab: tabKey,
    ownerId,
    nodeId,
  } = parse(normalizedSearch) as {
    tab?: string;
    ownerId?: string;
    nodeId?: string;
  };

  useEffect(() => {
    if (stringify(parse(search)) !== normalizedSearch || pathname === '/') {
      history.replace({
        pathname: pathname === '/' ? '/home' : pathname,
        search: normalizedSearch,
      });
    }
  }, [pathname, search, normalizedSearch]);

  const [collapseInfo, setCollapsedInfo] = useState(`收起/展开 ${foldHotKey.text}`);
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    if (!collapsed) {
      setTimeout(() => setCollapsedInfo(`收起/展开 ${foldHotKey.text}`), 250);
    } else {
      setCollapsedInfo(``);
    }
  }, [collapsed]);

  useKeyPress([foldHotKey.key], (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleCollapsed();
  });

  const closeAllModal = () => {
    modalManager.closeAllModals();
  };

  return (
    <div className={styles.layoutContainer}>
      <div
        className={classnames(
          styles.menuContainer,
          collapsed ? styles.fold : styles.unfold,
        )}
      >
        {/* Logo 区 */}
        <div className={styles.siderHeader}>
          <Logo className={styles.siderLogo} />
          {!collapsed && <span className={styles.siderTitle}>开放互联平台</span>}
        </div>

        {/* 协议切换器等额外区域 */}
        {siderTopExtra && !collapsed && (
          <div className={styles.siderTopExtra}>{siderTopExtra}</div>
        )}

        {/* 菜单区 */}
        <div className={styles.menuWrapper}>
          <Menu
            theme="dark"
            selectedKeys={[tabKey as string]}
            mode="inline"
            inlineCollapsed={collapsed}
            items={menuItems}
            onSelect={({ key }) => {
              closeAllModal();
              history.replace({
                pathname: pathname === '/' ? '/home' : pathname,
                search: stringify({ ownerId, nodeId, tab: key }),
              });
            }}
          />
        </div>

        {/* 折叠按钮 */}
        <div className={styles.collapseInfo}>
          <div onClick={toggleCollapsed}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        </div>
      </div>

      <div
        className={classnames(styles.contentContainer, {
          [styles.workbenchContentContainer]: tabKey === 'workbench',
        })}
      >
        {findMenuComponent(menuItems, tabKey)}
      </div>
    </div>
  );
};

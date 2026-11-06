import { ArrowLeftOutlined } from '@ant-design/icons';
import { App } from 'antd';
import { Link, Outlet, useLocation } from 'umi';

import { DEMO_AUTH_DISABLED } from '@/config/demo-auth';

import styles from './index.less';

export enum GlobalLayout {
  main = 'main',
  drawer = 'drawer',
}

const GlobalLayoutComponent = () => {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const ownerId = params.get('ownerId') || params.get('nodeId');
  // Return to the current protocol home without stale project parameters.
  const homeParams = new URLSearchParams({ tab: 'workbench' });
  if (ownerId) homeParams.set('ownerId', ownerId);
  const showPlatformHome =
    pathname === '/fate-management' ||
    // Legacy demo bookmarks can omit ownerId; their home stays on this origin.
    ((!!ownerId || DEMO_AUTH_DISABLED) &&
      ['/dag', '/connectivity-dag'].includes(pathname));

  return (
    <App style={{ height: '100%' }}>
      <div className={styles.root}>
        {showPlatformHome && (
          <nav className={styles.platformNavigation} aria-label="平台导航">
            <Link className={styles.platformHomeLink} to={`/edge?${homeParams}`}>
              <ArrowLeftOutlined />
              <span>返回总平台</span>
            </Link>
          </nav>
        )}
        <div className={styles.pageContent}>
          <Outlet />
        </div>
      </div>
    </App>
  );
};

export default GlobalLayoutComponent;

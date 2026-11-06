import { parse } from 'query-string';
import { Navigate, Outlet } from 'umi';

import { DEMO_AUTH_DISABLED } from '@/config/demo-auth';

/**
 * 判断 URL 上有没有 ownerId 参数
 * 比如: /node /my-node /message 路由用来判断有没有 ownerId
 */

const BasicNodeAuth = () => {
  if (DEMO_AUTH_DISABLED) return <Outlet />;

  const { ownerId } = parse(window.location.search);
  if (!ownerId) return <Navigate to="/login" />;

  return <Outlet />;
};

export default BasicNodeAuth;

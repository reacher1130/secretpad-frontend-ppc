import { Navigate, Outlet } from 'umi';

import { DEMO_AUTH_DISABLED } from '@/config/demo-auth';

// 在这里控制是不是第一次进入平台
const BeginnerAuth = () => {
  if (DEMO_AUTH_DISABLED) return <Outlet />;

  const neverLogined = localStorage.getItem('neverLogined');
  const token = localStorage.getItem('User-Token') || '';
  if (!neverLogined || !token) {
    // localStorage.setItem('neverLogined', 'true');
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default BeginnerAuth;

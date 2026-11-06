import { history } from 'umi';
import request from 'umi-request';
import { v4 as uuidv4 } from 'uuid';

import { DEMO_AUTH_DISABLED } from '@/config/demo-auth';
import { LoginService } from '@/modules/login/login.service';
import { getModel } from '@/util/valtio-helper';

request.interceptors.request.use((url, options) => {
  const traceId = uuidv4(); // 生成唯一的 traceId
  const token = localStorage.getItem('User-Token') || '';
  return {
    url: `${url}`,
    options: {
      ...options,
      mode: 'cors',
      credentials: 'include',
      interceptors: true,
      headers: {
        'Content-Type': 'application/json',
        'User-Token': token,
        'Trace-Id': traceId,
      },
    },
  };
});

request.interceptors.response.use(async (response) => {
  const { status } = await response.clone().json();
  if (!DEMO_AUTH_DISABLED && status.code === 202011602) {
    history.push('/login');
  }
  return response;
});

/**
 * The demo build skips the route-level login wrappers, but the rest of the
 * application still needs the server-provided platform/owner/node context
 * for menu visibility and project creation.  Hydrate that context before the
 * first render; the unauthenticated backend returns a synthetic demo user.
 * A missing backend must not turn a static demo page into a blank screen.
 */
export async function render(oldRender: () => void) {
  if (DEMO_AUTH_DISABLED) {
    try {
      await getModel(LoginService).getUserInfoAsync();
    } catch (error) {
      console.warn('demo user context bootstrap failed', error);
    }
  }
  oldRender();
}

import dotenv from 'dotenv';
import { defineConfig } from 'umi';

import { routes } from './routes';

let proxyOptions;
try {
  const config = dotenv.config().parsed;
  if (!config || !config?.PROXY_URL) {
    throw new Error();
  }
  proxyOptions = {
    proxy: {
      '/api': {
        target: config?.PROXY_URL,
        changeOrigin: true,
        secure: false,
      },
      '/v1': {
        target: config?.PROXY_URL,
        changeOrigin: true,
        secure: false,
      },
      '/sync': {
        target: config?.PROXY_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  };
} catch (e) {
  console.warn('如果在本地开发，需要做api代理，可以手动在platform目录下增加.env文件');
  console.warn('文件内容为：');
  console.warn(`
      PROXY_URL = http(s)://xxxxxx
  `);
}

export default defineConfig({
  routes,
  // The demo build passes SECRET_PAD_DEMO_AUTH_DISABLED=true.  Keep the
  // source default disabled so normal/production builds retain login gates.
  define: {
    __SECRET_PAD_DEMO_AUTH_DISABLED__: ['1', 'true', 'yes'].includes(
      (process.env.SECRET_PAD_DEMO_AUTH_DISABLED || '').toLowerCase(),
    ),
  },
  npmClient: 'pnpm',
  // https: {},
  svgr: {},
  title: '隐私计算开放互联平台',
  favicons: ['/platform-mark.svg'],
  extraBabelPlugins: [
    'babel-plugin-transform-typescript-metadata',
    'babel-plugin-parameter-decorator',
  ],
  mfsu: false,
  codeSplitting: {
    jsStrategy: 'granularChunks',
  },
  // oneApi: {
  //   apps: [
  //     {
  //       name: 'secretpad', // 后端应用名
  //       tag: 'feature/0.9.0b0_merge', // 分支 tag
  //       source: 'ZAPPINFO', // 应用来源，默认 ZAPPINFO，其他来源可在官网的应用信息中查看
  //     },
  //   ],
  //   typescript: true, // 每个接口的类型定义，自动生成，默认 false
  // },
  esbuildMinifyIIFE: true,
  ...proxyOptions,
});

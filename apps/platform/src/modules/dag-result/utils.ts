import dayjs from 'dayjs';

import { DataSourceType } from '@/modules/data-source-list/type';

export const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return '';
  const raw = String(timestamp).trim();
  const numeric = Number(raw);
  // BFIA and a few adapter APIs return Unix timestamps (seconds or
  // milliseconds), while the original SecretPad pages return ISO strings.
  // `new Date('1784666027000')` is invalid in browsers, so normalize numeric
  // values before falling back to the existing date-string path.
  const parsed = Number.isFinite(numeric)
    ? new Date(numeric < 1_000_000_000_000 ? numeric * 1000 : numeric)
    : new Date(raw);
  const epoch = parsed.getTime();
  if (Number.isNaN(epoch)) return '';
  const min = epoch / 1000 / 60;
  const localNow = new Date().getTimezoneOffset();

  const localTime = min - localNow;
  return dayjs(new Date(localTime * 1000 * 60)).format('YYYY-MM-DD HH:mm:ss');
};

export const getDownloadBtnTitle = (type: DataSourceType, path?: string) => {
  switch (type) {
    case DataSourceType.OSS:
      return `OSS 文件不支持直接下载，请到 OSS 对应 bucket 的预设路径下找到文件下载，地址：${path}`;
    case DataSourceType.ODPS:
      return `ODPS 文件不支持直接下载，请到 ODPS 对应项目下找到文件下载，地址：${path}`;
    case DataSourceType.MYSQL:
      return `MYSQL 文件不支持直接下载，请到 MYSQL 对应的数据库下找到文件下载，地址：${path}`;
    default:
      return '';
  }
};

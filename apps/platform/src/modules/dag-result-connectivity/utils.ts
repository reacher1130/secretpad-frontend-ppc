import dayjs from 'dayjs';

export const formatTimestamp = (timestamp: string | number) => {
  const min = new Date(timestamp).getTime() / 1000 / 60;
  const localNow = new Date().getTimezoneOffset();

  const localTime = min - localNow;

  return dayjs(new Date(localTime * 1000 * 60)).format('YYYY-MM-DD HH:mm:ss');
};

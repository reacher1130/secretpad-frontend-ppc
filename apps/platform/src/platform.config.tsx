import { ReactComponent as Logo } from '@/assets/platform-mark.svg';

const hour = new Date().getHours();
let time = '';
if (hour < 12) {
  time = '上午';
} else if (hour > 18) {
  time = '晚上';
} else if (hour >= 12) {
  time = '下午';
}

export default {
  theme: {
    token: {
      colorPrimary: '#5566e8',
    },
  },
  slogan: '让隐私计算，开放互联',
  header: {
    logo: <Logo viewBox="0 0 64 64" width={38} height={38} />,
    rightLinks: true,
  },
  createProject: {
    showTemplate: true,
  },
  home: {
    HomePageTitle: `${time}好，欢迎来到隐私计算开放互联平台`,
  },
  guide: true,
};

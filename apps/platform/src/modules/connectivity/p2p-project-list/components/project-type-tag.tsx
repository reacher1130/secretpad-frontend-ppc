import {
  DownloadOutlined,
  PartitionOutlined,
  FileSyncOutlined,
} from '@ant-design/icons';
import { Tag } from 'antd';

export enum ProjectType {
  'HETERO_FL' = 'HETERO_FL',
  'MPC' = 'MPC',
  'HOMO_FL' = 'HOMO_FL',
}

import styles from './index.less';

export const ProjectTypeMap = {
  [ProjectType.HETERO_FL]: {
    tagIcon: <DownloadOutlined style={{ color: '#E6FFFB' }} />,
    tagText: '纵向联邦',
    style: {
      backgroundImage: 'linear-gradient(180deg, #F5FFFD 0%, #E6FFFB 100%)',
    },
  },
  [ProjectType.MPC]: {
    tagIcon: (
      <PartitionOutlined style={{ color: '#A878FF', transform: `rotate(-90deg)` }} />
    ),
    tagText: '多方安全计算',
    style: {
      backgroundImage: 'linear-gradient(180deg, #FEFCFF 0%, #F9F0FF 100%)',
    },
  },
  [ProjectType.HOMO_FL]: {
    tagIcon: <FileSyncOutlined style={{ color: '#FAAD14' }} />,
    tagText: '横向联邦',
    style: {
      backgroundImage: 'linear-gradient(180deg, #FFFFFE 0%, #FFF7E6 100%)',
    },
  },
};

export const ProjectTypeTag = ({ type }: { type: ProjectType }) => {
  const itemObj = ProjectTypeMap[type];
  if (!type) return <>{'--'}</>;
  if (!itemObj) return <>{'--'}</>;
  return (
    <Tag className={styles.projectTypeTag} icon={itemObj.tagIcon} style={itemObj.style}>
      {itemObj.tagText}
    </Tag>
  );
};

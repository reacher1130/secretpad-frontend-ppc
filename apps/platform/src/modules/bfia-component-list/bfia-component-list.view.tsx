import { EyeOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Spin, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';

import { useModel } from '@/util/valtio-helper';

import { BfiaAlgorithmRunPanel } from './bfia-algorithm-run.view';
import type { BfiaComponent, BfiaCompListVO } from './bfia-component-list.service';
import { BfiaComponentListService } from './bfia-component-list.service';
import { BfiaPreviewCanvas } from './bfia-preview-canvas';
import styles from './index.less';

const { Title, Text } = Typography;

export const BfiaComponentListComponent = () => {
  const bfiaComponentService = useModel(BfiaComponentListService);
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    bfiaComponentService.getComponentList();
  }, []);

  const renderComponentCard = (component: BfiaComponent) => (
    <Card
      key={`${component.domain}-${component.name}`}
      size="small"
      className={styles.componentCard}
    >
      <div className={styles.componentHeader}>
        <Title level={5} className={styles.componentName}>
          {component.name}
        </Title>
        <Tag color="blue">{component.domain}</Tag>
      </div>
      <div className={styles.componentInfo}>
        <Text type="secondary" className={styles.componentVersion}>
          版本: {component.version}
        </Text>
        {component.desc && (
          <Text className={styles.componentDesc}>{component.desc}</Text>
        )}
      </div>
    </Card>
  );

  const renderComponentGroup = (groupName: string, group: BfiaCompListVO) => (
    <div key={groupName} className={styles.componentGroup}>
      <div className={styles.groupHeader}>
        <Title level={4}>{groupName}</Title>
        <Text type="secondary">
          版本: {group.version} | 描述: {group.desc}
        </Text>
      </div>
      <div className={styles.componentGrid}>
        {group.comps && group.comps.length > 0 ? (
          group.comps.map(renderComponentCard)
        ) : (
          <Empty description="暂无组件" />
        )}
      </div>
    </div>
  );

  const componentGroups = Object.entries(bfiaComponentService.componentList);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Title level={3}>已集成算法</Title>
          <Text type="secondary">查看当前BFIA协议下可用的算法组件</Text>
        </div>
        <div className={styles.headerRight}>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            disabled={bfiaComponentService.loading || !componentGroups.length}
            onClick={() => setPreviewVisible(true)}
          >
            预览
          </Button>
        </div>
      </div>
      <div className={styles.content}>
        <BfiaAlgorithmRunPanel />
        {bfiaComponentService.loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
          </div>
        ) : componentGroups.length ? (
          componentGroups.map(([groupName, group]) =>
            renderComponentGroup(groupName, group),
          )
        ) : (
          <div className={styles.emptyContainer}>
            <Empty description="暂无BFIA组件" />
          </div>
        )}
      </div>

      {previewVisible && (
        <BfiaPreviewCanvas
          visible={previewVisible}
          onClose={() => setPreviewVisible(false)}
          componentList={bfiaComponentService.componentList}
        />
      )}
    </div>
  );
};

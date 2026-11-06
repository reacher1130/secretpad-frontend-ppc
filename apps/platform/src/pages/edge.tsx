import { ConfigProvider, Modal, message, Button, Spin, Result } from 'antd';
import { parse } from 'query-string';
import { useEffect, useState } from 'react';
import { useLocation, history } from 'umi';

import { ReactComponent as PlatformMark } from '@/assets/platform-mark.svg';
import { hasAccess, Platform } from '@/components/platform-wrapper';
import { HeaderModel } from '@/modules/layout/home-layout/header-view';
import { HomeLayoutService } from '@/modules/layout/home-layout/home-layout.service';
import { MessageService } from '@/modules/message-center/message.service';
import { NodeService } from '@/modules/node';
import { protocolMenuItems } from '@/modules/protocol-navigation/menus';
import { protocolHome } from '@/modules/protocol-navigation/navigation';
import { protocolProfiles } from '@/modules/protocol-navigation/profiles';
import { ProtocolWorkspace } from '@/modules/protocol-navigation/workspace';
import {
  getProtocolConfig,
  restartKuscia,
} from '@/services/secretpad/ProtocolController';
import { useModel } from '@/util/valtio-helper';

import styles from './edge.less';

const EdgePage = () => {
  const { search } = useLocation();
  const { ownerId } = parse(search);
  const homeLayoutService = useModel(HomeLayoutService);
  const messageService = useModel(MessageService);
  const nodeService = useModel(NodeService);
  const headerModel = useModel(HeaderModel);
  const activeProtocol = headerModel.protocolActive;
  const [modal, modalContext] = Modal.useModal();
  const profile = protocolProfiles[activeProtocol];
  const [protocolSwitching, setProtocolSwitching] = useState(false);
  const [protocolLoading, setProtocolLoading] = useState(true);
  const [protocolError, setProtocolError] = useState('');

  const loadProtocol = async () => {
    setProtocolLoading(true);
    setProtocolError('');
    try {
      const response = await getProtocolConfig();
      if (response.status?.code !== 0 || !response.data) {
        throw new Error(response.status?.msg || '后端未返回当前协议');
      }
      headerModel.applyProtocolConfig(response.data);
    } catch (error) {
      setProtocolError((error as Error).message);
    } finally {
      setProtocolLoading(false);
    }
  };

  const isAutonomyMode = hasAccess({ type: [Platform.AUTONOMY] });

  useEffect(() => {
    document.body.classList.add('protocolWorkspacePage');
    return () => document.body.classList.remove('protocolWorkspacePage');
  }, []);

  useEffect(() => {
    loadProtocol();
    const getNodeList = async () => {
      const nodeList = await nodeService.listNode();
      if (ownerId) {
        const node = nodeList.find((n) => ownerId === n.nodeId);
        if (node) nodeService.setCurrentNode(node);
      }
    };
    const getMessageTotal = async () => {
      if (ownerId) {
        const res = await messageService.getMessageCount(ownerId as string);
        if (res.status) {
          homeLayoutService.setMessageCount(res?.data || 0);
        }
      }
    };
    homeLayoutService.setSubTitle('Edge');
    if (!isAutonomyMode) {
      getNodeList();
    }
    // 获取未处理消息数量
    getMessageTotal();
  }, []);

  // Only render the new protocol after the backend has confirmed its runtime.
  const handleProtocolChange = (value: string | number) => {
    const protocol = String(value) as API.PrivacyProtocol;
    const protocolLabel = protocolProfiles[protocol].label;
    modal.confirm({
      title: `切换为 ${protocolLabel} 协议`,
      content:
        '切换会校验对应对端节点、算法镜像和通信路由。请先确认当前没有正在运行的任务。',
      okText: '确认切换',
      cancelText: '取消',
      onOk: async () => {
        setProtocolSwitching(true);
        try {
          const response = await restartKuscia({
            protocol,
          });
          if (response.status?.code !== 0 || !response.data) {
            throw new Error(response.status?.msg || '后端未返回当前协议');
          }
          const confirmed =
            response.data.activeProtocol || response.data.defaultProtocol;
          headerModel.applyProtocolConfig(response.data);
          history.replace(protocolHome(confirmed, search));
          message.success(`已切换到 ${protocolProfiles[confirmed].label}`);
        } catch (e) {
          message.error('协议切换失败：' + (e as Error).message);
          await loadProtocol();
        } finally {
          setProtocolSwitching(false);
        }
      },
    });
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: profile.color,
          colorText: '#29334d',
          colorTextSecondary: '#7b859a',
          colorBorder: '#e2e6f0',
          colorBgLayout: '#f5f6fa',
          borderRadius: 10,
          controlHeight: 36,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
        },
      }}
    >
      {modalContext}
      {protocolLoading ? (
        <div className={styles.loadingState}>
          <PlatformMark viewBox="0 0 64 64" />
          <h2>正在连接工作空间</h2>
          <Spin />
          <p>读取当前协议与节点配置</p>
        </div>
      ) : protocolError ? (
        <Result
          status="error"
          title="无法加载当前协议"
          subTitle={protocolError}
          extra={<Button onClick={loadProtocol}>重新连接</Button>}
        />
      ) : (
        <ProtocolWorkspace
          key={activeProtocol}
          protocol={activeProtocol}
          supportedProtocols={headerModel.supportedProtocols.filter(
            (item) => !!protocolProfiles[item],
          )}
          canSwitch={headerModel.protocolCanSwitch}
          switching={protocolSwitching}
          menuItems={protocolMenuItems[activeProtocol]}
          onSwitch={handleProtocolChange}
        />
      )}
    </ConfigProvider>
  );
};

export default EdgePage;

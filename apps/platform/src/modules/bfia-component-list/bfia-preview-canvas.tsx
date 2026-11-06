import { CloseOutlined, HolderOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Card, Drawer, Empty, Input, Space, Tag, Typography, message } from 'antd';
import { Graph, Node, Edge } from '@antv/x6';
import { useSize } from 'ahooks';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Emitter } from '@secretflow/utils';
import { DAG, Portal, ActionType } from '@secretflow/dag';

// 导入dag样式和形状
import '@secretflow/dag/src/shapes/index.less';
// 导入dag包以注册dag-node形状
import '@secretflow/dag';

import { BfiaComponent, BfiaCompListVO } from './bfia-component-list.service';

import styles from './bfia-preview-canvas.less';

const { Title, Text } = Typography;
const { Search } = Input;

interface BfiaPreviewCanvasProps {
  visible: boolean;
  onClose: () => void;
  componentList: Record<string, BfiaCompListVO>;
}

// 事件发射器类型定义
interface ComponentDragEvent {
  component: BfiaComponent;
  e: React.MouseEvent<Element, MouseEvent>;
}

export const BfiaPreviewCanvas = ({
  visible,
  onClose,
  componentList,
}: BfiaPreviewCanvasProps) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredComponents, setFilteredComponents] = useState<BfiaComponent[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const { width, height } = useSize(viewRef.current) || {};
  const nodeCounterRef = useRef(0);
  
  // 使用隐语项目空间的DAG实例
  const dagRef = useRef<DAG | null>(null);
  
  // 使用隐语项目空间的事件发射器模式
  const onComponentDraggedEmitter = useRef(new Emitter<ComponentDragEvent>());

  // 初始化画布
  useEffect(() => {
    if (visible && containerRef.current) {
      initDAG(containerRef.current);
    }
    return () => {
      if (dagRef.current) {
        dagRef.current.dispose();
        dagRef.current = null;
      }
    };
  }, [visible]);

  // 监听组件拖拽事件（隐语项目空间模式）
  useEffect(() => {
    const handleComponentDrag = ({ component, e }: ComponentDragEvent) => {
      if (!dagRef.current) return;
      
      nodeCounterRef.current += 1;
      const nodeId = `bfia-node-${nodeCounterRef.current}`;
      
      // 使用隐语项目空间的GraphManager处理拖拽
      dagRef.current.graphManager.executeAction(
        ActionType.dragNode,
        {
          id: nodeId,
          label: component.name,
          codeName: `${component.domain}/${component.name}`,
          status: 'default',
        },
        e.nativeEvent,
      );
    };

    onComponentDraggedEmitter.current.on(handleComponentDrag);
    
    return () => {
      // Emitter没有removeListener方法，使用dispose清理
      onComponentDraggedEmitter.current.dispose();
    };
  }, [dagRef.current]);

  // 处理画布大小变化
  useEffect(() => {
    if (dagRef.current && width && height) {
      const graph = dagRef.current.graphManager.getGraphInstance();
      if (graph) {
        graph.resize(width, height);
      }
    }
  }, [width, height]);

  // 添加键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dagRef.current) return;
      const graph = dagRef.current.graphManager.getGraphInstance();
      if (!graph) return;

      // Delete键删除选中节点
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodes.length > 0) {
          graph.removeCells(selectedNodes);
          setSelectedNodes([]);
          message.success(`已删除 ${selectedNodes.length} 个组件`);
        }
      }

      // Ctrl+A全选
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        const nodes = graph.getNodes();
        setSelectedNodes(nodes.map(node => node.id));
        message.info(`已选择 ${nodes.length} 个组件`);
      }

      // Escape取消选择
      if (e.key === 'Escape') {
        setSelectedNodes([]);
        message.info('已取消选择');
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [visible, selectedNodes]);

  // 处理组件列表变化
  useEffect(() => {
    const allComponents: BfiaComponent[] = [];
    Object.values(componentList).forEach(group => {
      if (group.comps) {
        allComponents.push(...group.comps);
      }
    });
    setFilteredComponents(allComponents);
  }, [componentList]);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    const allComponents: BfiaComponent[] = [];
    Object.values(componentList).forEach(group => {
      if (group.comps) {
        allComponents.push(...group.comps);
      }
    });
    
    if (!value) {
      setFilteredComponents(allComponents);
    } else {
      const filtered = allComponents.filter(component =>
        component.name.toLowerCase().includes(value.toLowerCase()) ||
        component.domain.toLowerCase().includes(value.toLowerCase()) ||
        (component.desc && component.desc.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredComponents(filtered);
    }
  };

  const initGraph = (container: HTMLDivElement) => {
    const { clientWidth, clientHeight } = container;
    const _graph = new Graph({
      container,
      width: clientWidth,
      height: clientHeight,
      grid: {
        visible: true,
        type: 'dot',
        size: 20,
        args: {
          color: '#e5e5e5',
          thickness: 1,
        },
      },
      background: {
        color: '#fafafa',
      },
      mousewheel: {
        enabled: true,
        zoomAtMousePosition: true,
        modifiers: 'ctrl',
        minScale: 0.5,
        maxScale: 3,
      },
      connecting: {
        router: {
          name: 'manhattan',
          args: {
            padding: 1,
          },
        },
        connector: {
          name: 'rounded',
          args: {
            radius: 8,
          },
        },
        anchor: 'center',
        connectionPoint: 'anchor',
        allowBlank: false,
        snap: {
          radius: 20,
        },
        createEdge() {
          return this.createEdge({
            shape: 'edge',
            attrs: {
              line: {
                stroke: '#A2B1C3',
                strokeWidth: 2,
                targetMarker: {
                  name: 'block',
                  width: 12,
                  height: 8,
                },
              },
            },
            router: {
              name: 'manhattan',
            },
          });
        },
      },
      highlighting: {
        magnetAdsorbed: {
          name: 'stroke',
          args: {
            attrs: {
              fill: '#5F95FF',
              stroke: '#5F95FF',
            },
          },
        },
      },
    });

    // 添加节点选择事件
    _graph.on('node:selected', ({ node }: { node: Node }) => {
      setSelectedNodes(prev => [...prev, node.id]);
    });

    _graph.on('node:unselected', ({ node }: { node: Node }) => {
      setSelectedNodes(prev => prev.filter(id => id !== node.id));
    });

    // 添加节点双击事件
    _graph.on('node:dblclick', ({ node }) => {
      const data = node.getData();
      if (data?.component) {
        message.info(`组件: ${data.component.name} - ${data.component.desc || '无描述'}`);
      }
    });

    // 添加边连接事件
    _graph.on('edge:connected', ({ edge }) => {
      message.success('组件连接成功');
    });

  };

  // 使用隐语项目空间的事件发射器模式
  const handleComponentDragStart = (e: React.MouseEvent, component: BfiaComponent) => {
    e.preventDefault();
    e.persist();
    
    // 发射拖拽事件，让画布处理
    onComponentDraggedEmitter.current.fire({
      component,
      e,
    });
  };


  const renderComponentItem = (component: BfiaComponent) => (
    <div
      key={`${component.domain}-${component.name}`}
      className={styles.componentNode}
      onMouseDown={(e) => handleComponentDragStart(e, component)}
    >
      <div className={styles.nodeTitle}>
        <span className={styles.icon}>
          {/* 这里可以添加组件图标 */}
        </span>
        <span>{component.name}</span>
      </div>
      <div className={styles.nodeDragHolder}>
        <HolderOutlined />
      </div>
    </div>
  );

  const initDAG = (container: HTMLDivElement) => {
    const { clientWidth, clientHeight } = container;
    
    // 创建DAG实例
    const dag = new DAG();
    dagRef.current = dag;
    
    // 初始化DAG
    dag.init(
      'bfia-preview',
      {
        container,
        width: clientWidth,
        height: clientHeight,
        grid: {
          visible: true,
          type: 'dot',
          size: 20,
          args: {
            color: '#e5e5e5',
            thickness: 1,
          },
        },
        background: {
          color: '#fafafa',
        },
        mousewheel: {
          enabled: true,
          zoomAtMousePosition: true,
          modifiers: 'ctrl',
          minScale: 0.5,
          maxScale: 3,
        },
        connecting: {
          router: {
            name: 'manhattan',
            args: {
              padding: 1,
            },
          },
          connector: {
            name: 'rounded',
            args: {
              radius: 8,
            },
          },
          anchor: 'center',
          connectionPoint: 'anchor',
          allowBlank: false,
          snap: {
            radius: 20,
          },
          createEdge() {
            return this.createEdge({
              shape: 'edge',
              attrs: {
                line: {
                  stroke: '#A2B1C3',
                  strokeWidth: 2,
                  targetMarker: {
                    name: 'block',
                    width: 12,
                    height: 8,
                  },
                },
              },
              router: {
                name: 'manhattan',
              },
            });
          },
        },
        highlighting: {
          magnetAdsorbed: {
            name: 'stroke',
            args: {
              attrs: {
                fill: '#5F95FF',
                stroke: '#5F95FF',
              },
            },
          },
        },
      },
      'FULL'
    );

    // 添加节点选择事件
    const graph = dag.graphManager.getGraphInstance();
    if (graph) {
      graph.on('node:selected', ({ node }: { node: Node }) => {
        setSelectedNodes(prev => [...prev, node.id]);
      });

      graph.on('node:unselected', ({ node }: { node: Node }) => {
        setSelectedNodes(prev => prev.filter(id => id !== node.id));
      });

      // 添加节点双击事件
      graph.on('node:dblclick', ({ node }) => {
        const data = node.getData();
        if (data?.component) {
          message.info(`组件: ${data.component.name} - ${data.component.desc || '无描述'}`);
        }
      });

      // 添加边连接事件
      graph.on('edge:connected', ({ edge }) => {
        message.success('组件连接成功');
      });
    }
  };

  const clearCanvas = () => {
    if (dagRef.current) {
      const graph = dagRef.current.graphManager.getGraphInstance();
      if (graph) {
        graph.clearCells();
        setSelectedNodes([]);
        message.success('画布已清空');
      }
    }
  };

  const zoomToFit = () => {
    if (dagRef.current) {
      const graph = dagRef.current.graphManager.getGraphInstance();
      if (graph) {
        graph.zoomToFit({ padding: 20 });
      }
    }
  };


  return (
    <Drawer
      title="BFIA组件预览画布"
      placement="right"
      width="90%"
      height="100%"
      open={visible}
      onClose={onClose}
      maskClosable={false}
      extra={
        <Space>
          <Button onClick={zoomToFit}>适应画布</Button>
                 <Button onClick={() => {
                   if (dagRef.current) {
                     const graph = dagRef.current.graphManager.getGraphInstance();
                     if (graph) {
                       const nodes = graph.getNodes();
                       setSelectedNodes(nodes.map(node => node.id));
                       message.info(`已选择 ${nodes.length} 个组件`);
                     }
                   }
                 }}>全选</Button>
          <Button onClick={() => {
            setSelectedNodes([]);
            message.info('已取消选择');
          }}>取消选择</Button>
          {selectedNodes.length > 0 && (
            <Button 
              danger 
              icon={<DeleteOutlined />} 
                     onClick={() => {
                       if (dagRef.current) {
                         const graph = dagRef.current.graphManager.getGraphInstance();
                         if (graph) {
                           graph.removeCells(selectedNodes);
                           setSelectedNodes([]);
                           message.success(`已删除 ${selectedNodes.length} 个组件`);
                         }
                       }
                     }}
            >
              删除选中 ({selectedNodes.length})
            </Button>
          )}
          <Button onClick={clearCanvas}>清空画布</Button>
          <Button icon={<CloseOutlined />} onClick={onClose}>
            关闭
          </Button>
        </Space>
      }
    >
      <div className={styles.canvasContainer}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <Title level={5}>组件库</Title>
            <Search
              placeholder="搜索组件..."
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
              allowClear
            />
          </div>
          <div className={styles.componentList}>
            {filteredComponents.length > 0 ? (
              filteredComponents.map(renderComponentItem)
            ) : (
              <Empty description="暂无组件" />
            )}
          </div>
        </div>
        
        <div className={styles.canvasArea}>
          <div className={styles.canvasToolbar}>
            <Space split={<span>|</span>}>
              <Text type="secondary">拖拽组件到画布中进行预览</Text>
              <Text type="secondary">双击节点查看详情</Text>
              <Text type="secondary">拖拽节点端口进行连接</Text>
              <Text type="secondary">Delete键删除选中节点</Text>
            </Space>
          </div>
          <div 
            className={styles.canvas} 
            ref={viewRef}
          >
            <div ref={containerRef} className={styles.graphContainer} />
          </div>
        </div>
      </div>
    </Drawer>
  );
};

import React from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import classNames from 'classnames';
import { MyDataComponent } from './component/mydata';
import { TodoDataComponent } from './component/tododata';
import styles from './index.less';

const items: TabsProps['items'] = [
  {
    key: 'my-done-data',
    label: '我方数据',
    children: <MyDataComponent />,
  },
  {
    key: 'my-todo-data',
    label: '待我处理的数据',
    children: <TodoDataComponent />,
  },
];
export const ConnectivityDataManagerComponent = () => {
  return (
    <div className={classNames(styles.mydata)}><Tabs defaultActiveKey="my-done-data" items={items} /></div>
  )
}

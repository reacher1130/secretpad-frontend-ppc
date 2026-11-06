import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import classNames from 'classnames';
import { CooperationDataComponent } from './component/cooperationdata';
import { TodoDataComponent } from './component/tododata';
import styles from './index.less';

const items: TabsProps['items'] = [
  {
    key: 'cooperation-done-data',
    label: '合作方数据',
    children: <CooperationDataComponent />,
  },
  {
    key: 'cooperation-todo-data',
    label: '待合作方处理的数据',
    children: <TodoDataComponent />,
  },
];
export const ConnectivityCooperationDataManagerComponent = () => {
  return (
    <div className={classNames(styles.mydata)}>
      {/* <Tabs defaultActiveKey="cooperation-done-data" items={items} /> */}
      <CooperationDataComponent />
    </div>
  )
}

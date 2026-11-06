import { Alert, Button, Input, InputNumber, Select } from 'antd';
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';

import {
  buildFateTemplate,
  FATE_JOB_TEMPLATES,
  templateDatasetOptions,
  type FateJobTemplateId,
  type FateTemplateResult,
} from './job-templates';
import { LOCAL_NATIVE_FATE_CONFIG } from './native-config';
import styles from './index.less';

const defaultParties = JSON.parse(LOCAL_NATIVE_FATE_CONFIG).role;

export function FateTemplatePicker({
  clusterId,
  datasets,
  target,
  disabled,
  onApply,
}: {
  clusterId?: string;
  datasets: API.FateDatasetVO[];
  target: 'job' | 'canvas';
  disabled?: boolean;
  onApply: (result: FateTemplateResult) => void;
}) {
  const [selected, setSelected] = useState<FateJobTemplateId>('psi');
  const [guestId, setGuestId] = useState<string>();
  const [hostId, setHostId] = useState<string>();
  const [guestParty, setGuestParty] = useState(defaultParties.guest[0]);
  const [hostParty, setHostParty] = useState(defaultParties.host[0]);
  const [epochs, setEpochs] = useState<number | null>(2);
  const [error, setError] = useState('');
  const guests = templateDatasetOptions(datasets, clusterId, 'guest');
  const hosts = templateDatasetOptions(datasets, clusterId, 'host');
  const guestKeys = guests.map((item) => item.datasetId).join(',');
  const hostKeys = hosts.map((item) => item.datasetId).join(',');

  useEffect(() => {
    const chooseDefault = (items: API.FateDatasetVO[], current?: string) => {
      if (items.some((item) => item.datasetId === current)) return current;
      return items.length === 1 ? items[0].datasetId : undefined;
    };
    setGuestId((current) => chooseDefault(guests, current));
    setHostId((current) => chooseDefault(hosts, current));
    setError('');
  }, [clusterId, guestKeys, hostKeys]);

  const apply = () => {
    const guest = guests.find((item) => item.datasetId === guestId);
    const host = hosts.find((item) => item.datasetId === hostId);
    if (!guest || !host) {
      setError('请选择当前集群的 Guest 和 Host 数据集；可先在“数据资产”登记。');
      return;
    }
    try {
      const result = buildFateTemplate(selected, {
        guestPartyId: guestParty,
        hostPartyId: hostParty,
        guestDatasetId: guest.datasetId,
        hostDatasetId: host.datasetId,
        guestDatasetRef: `${guest.namespace}#${guest.tableName}`,
        hostDatasetRef: `${host.namespace}#${host.tableName}`,
        epochs: epochs ?? 0,
      });
      setError('');
      onApply(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '模板配置有误');
    }
  };

  return (
    <section className={styles.templatePicker} aria-label="FATE 作业模板">
      <div className={styles.templateHeading}>
        <div>
          <span className={styles.sectionEyebrow}>QUICK START</span>
          <h3>从模板开始</h3>
          <p>
            选好流程与双方数据，再继续编辑{target === 'canvas' ? '画布' : '作业配置'}。
          </p>
        </div>
        <span className={styles.templateBadge}>FATE 双方协作</span>
      </div>
      <div className={styles.templateGrid}>
        {FATE_JOB_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            aria-pressed={selected === template.id}
            disabled={disabled}
            className={`${styles.templateCard} ${
              selected === template.id ? styles.templateSelected : ''
            }`}
            onClick={() => {
              setSelected(template.id);
              setError('');
            }}
          >
            <span className={styles.templateCardTitle}>
              <strong>{template.title}</strong>
              {selected === template.id && <CheckCircleFilled />}
            </span>
            <span className={styles.templateDescription}>{template.description}</span>
            <span className={styles.templateSteps}>
              {template.steps.map((step, index) => (
                <span key={step}>
                  {index > 0 && <ArrowRightOutlined />} {step}
                </span>
              ))}
            </span>
            <span className={styles.templateDetail}>{template.detail}</span>
          </button>
        ))}
      </div>
      <div className={styles.templateBindings}>
        {[
          {
            role: 'Guest',
            items: guests,
            id: guestId,
            setId: setGuestId,
            party: guestParty,
            setParty: setGuestParty,
          },
          {
            role: 'Host',
            items: hosts,
            id: hostId,
            setId: setHostId,
            party: hostParty,
            setParty: setHostParty,
          },
        ].map((side) => (
          <div key={side.role} className={styles.templateParty}>
            <label>
              <span>{side.role} 数据集</span>
              <Select
                aria-label={`模板 ${side.role} 数据集`}
                value={side.id}
                onChange={side.setId}
                disabled={disabled || !clusterId}
                placeholder={clusterId ? '选择已登记的数据集' : '请先选择目标集群'}
                showSearch
                optionFilterProp="label"
                options={side.items.map((item) => ({
                  value: item.datasetId,
                  label: `${item.name || item.tableName} · ${item.namespace}#${
                    item.tableName
                  }`,
                }))}
                notFoundContent="暂无可用数据，请先在数据资产登记"
              />
            </label>
            <label>
              <span>{side.role} 参与方 ID</span>
              <Input
                aria-label={`模板 ${side.role} 参与方 ID`}
                value={side.party}
                onChange={(event) => side.setParty(event.target.value)}
                disabled={disabled}
              />
            </label>
          </div>
        ))}
      </div>
      <div className={styles.templateActions}>
        <div>
          {selected === 'psi-lr' && (
            <label className={styles.templateEpochs}>
              <span>训练轮数</span>
              <InputNumber
                aria-label="模板训练轮数"
                min={1}
                max={1000}
                precision={0}
                value={epochs}
                onChange={(value) => setEpochs(typeof value === 'number' ? value : null)}
                disabled={disabled}
              />
            </label>
          )}
          <p>参与方 ID 预填本地双端示例，可按目标环境修改。</p>
        </div>
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={apply}
          disabled={disabled || !clusterId}
        >
          {target === 'canvas' ? '应用到画布' : '填入作业配置'}
        </Button>
      </div>
      {error && <Alert type="warning" showIcon message={error} />}
    </section>
  );
}

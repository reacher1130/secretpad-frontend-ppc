import {
  CodeOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Modal,
  Progress,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getPlatformNodeId } from '@/components/platform-wrapper';

import {
  BFIA_ALGORITHM_CATALOG,
  PADDLE_ALGORITHM_DEMOS,
} from './bfia-algorithm-catalog';
import styles from './bfia-algorithm-run.less';
import {
  getAlgorithmRunLog,
  getAlgorithmRunReport,
  getLatestAlgorithmRun,
  isActiveRun,
  startAlgorithmRun,
  type AlgorithmRunState,
  type RunStatus,
} from './bfia-algorithm-run.service';

const { Paragraph, Text, Title } = Typography;

const statuses: Record<RunStatus, { label: string; color: string }> = {
  QUEUED: { label: '排队中', color: 'processing' },
  RUNNING: { label: '运行中', color: 'processing' },
  PASSED: { label: '通过', color: 'success' },
  FAILED: { label: '失败', color: 'error' },
};

const statusTag = (status?: RunStatus) =>
  status ? (
    <Tag color={statuses[status]?.color}>{statuses[status]?.label || status}</Tag>
  ) : (
    <Tag>未运行</Tag>
  );

const checkTag = (label: string, passed?: boolean | null) => (
  <Tag color={passed === true ? 'success' : passed === false ? 'error' : undefined}>
    {label}：{passed === true ? '通过' : passed === false ? '失败' : '待核验'}
  </Tag>
);

const standardTag = (standard: 'standard' | 'extension') => (
  <Tag color={standard === 'standard' ? 'cyan' : 'purple'}>
    {standard === 'standard' ? '已有开放协议' : '项目自研扩展'}
  </Tag>
);

const displayTime = (value?: string | null) => {
  if (!value) return '—';
  const time = dayjs(value);
  return time.isValid() ? time.format('YYYY-MM-DD HH:mm:ss') : '—';
};

const empty = (description: string) => (
  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
);

const AlgorithmLogContent = ({
  runId,
  algorithm,
  party,
  status,
}: {
  runId: string;
  algorithm: string;
  party: 'alice' | 'bob';
  status?: RunStatus;
}) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const ready = !!status && status !== 'QUEUED';

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    setLoading(true);
    const fetchLog = async () => {
      try {
        const next = await getAlgorithmRunLog(runId, algorithm, party);
        if (!cancelled) {
          setContent(next);
          setError('');
        }
      } catch (failure) {
        if (!cancelled) {
          setError(failure instanceof Error ? failure.message : '无法读取运行日志');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          if (status === 'RUNNING') timer = setTimeout(fetchLog, 4000);
        }
      }
    };
    void fetchLog();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [runId, algorithm, party, ready, status, reload]);

  if (!ready) return empty('该算法排队中，开始运行后会显示本次日志。');

  return (
    <div>
      <div className={styles.logTools}>
        <Text type="secondary">
          {status === 'RUNNING' ? '运行中，每 4 秒刷新' : '本次运行记录'}
        </Text>
        <Button
          icon={<ReloadOutlined />}
          size="small"
          loading={loading}
          onClick={() => setReload((value) => value + 1)}
        >
          刷新日志
        </Button>
      </div>
      {error && <Alert type={content ? 'warning' : 'info'} showIcon message={error} />}
      {content ? (
        <pre className={styles.logOutput} tabIndex={0} aria-label="本次运行日志内容">
          {content}
        </pre>
      ) : loading ? (
        <div className={styles.logLoading}>
          <Spin size="small" /> <Text type="secondary">正在读取本次运行日志…</Text>
        </div>
      ) : error ? null : (
        empty('本次运行的日志文件暂无内容。')
      )}
    </div>
  );
};

type ReportState = {
  loading: boolean;
  content?: string;
  error?: string;
  runId: string;
};

export const BfiaAlgorithmRunPanel = () => {
  const [state, setState] = useState<AlgorithmRunState>();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [startError, setStartError] = useState('');
  const [selectedId, setSelectedId] = useState<string>(BFIA_ALGORITHM_CATALOG[0].id);
  const [party, setParty] = useState('alice');
  const [report, setReport] = useState<ReportState>();
  const statusRequest = useRef(0);
  const reportRequest = useRef(0);
  const run = state?.run;
  const active = isActiveRun(run);
  const cooldownUntil =
    !active && !state?.canStart && run?.finishedAt
      ? dayjs(run.finishedAt).valueOf() + 65_000
      : 0;
  const coolingDown = cooldownUntil > Date.now();

  const refresh = useCallback(async (silent = false) => {
    const current = ++statusRequest.current;
    if (!silent) setLoading(true);
    try {
      const next = await getLatestAlgorithmRun();
      if (current === statusRequest.current) {
        setState(next);
        setStatusError('');
      }
      return next;
    } catch (error) {
      if (current === statusRequest.current) {
        setStatusError(
          error instanceof Error ? error.message : '无法读取 BFIA 运行状态',
        );
      }
    } finally {
      if (current === statusRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => {
      statusRequest.current += 1;
      reportRequest.current += 1;
    };
  }, [refresh]);

  useEffect(() => {
    if (!active && !coolingDown) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await refresh(true);
      if (!stopped && (active || cooldownUntil > Date.now())) {
        timer = setTimeout(poll, active ? 2000 : 5000);
      }
    };
    timer = setTimeout(poll, active ? 2000 : 5000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [active, coolingDown, cooldownUntil, refresh]);

  const start = async () => {
    setStarting(true);
    setStartError('');
    try {
      const next = await startAlgorithmRun(localStorage.getItem('User-Token') || '');
      setState(next);
      setStatusError('');
      if (next.run?.runId === run?.runId && !isActiveRun(next.run)) {
        setStartError('未创建新运行，当前显示上次验证记录。');
      }
    } catch (error) {
      setStartError(error instanceof Error ? error.message : 'BFIA 八算法运行未受理');
      // A network error can follow a successful submission. Read the actual latest run.
      const next = await refresh();
      if (next?.run && next.run.runId !== run?.runId) setStartError('');
    } finally {
      setStarting(false);
    }
  };

  const openReport = async () => {
    if (!run) return;
    const { runId } = run;
    const current = ++reportRequest.current;
    setReport({ loading: true, runId });
    try {
      const content = JSON.stringify(await getAlgorithmRunReport(runId), null, 2);
      if (current === reportRequest.current)
        setReport({ loading: false, runId, content });
    } catch (error) {
      if (current === reportRequest.current) {
        setReport({
          loading: false,
          runId,
          error: error instanceof Error ? error.message : '无法读取验证报告',
        });
      }
    }
  };

  const closeReport = () => {
    reportRequest.current += 1;
    setReport(undefined);
  };

  const exportReport = () => {
    if (!report?.content) return;
    const url = URL.createObjectURL(
      new Blob([report.content], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `bfia-${report.runId}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const paddleDemos = getPlatformNodeId() === 'alice' ? PADDLE_ALGORITHM_DEMOS : [];
  const catalog = [...paddleDemos, ...BFIA_ALGORITHM_CATALOG];
  const selected =
    catalog.find((item) => item.id === selectedId) || BFIA_ALGORITHM_CATALOG[0];
  const isDemo = 'demoLog' in selected;
  const check = isDemo
    ? undefined
    : run?.algorithms.find((item) => item.id === selected.id);
  const completed =
    run?.algorithms.filter(
      (item) => item.status === 'PASSED' || item.status === 'FAILED',
    ).length ?? 0;
  const passed =
    run?.algorithms.filter(
      (item) =>
        item.status === 'PASSED' && item.numerical === true && item.protocol === true,
    ).length ?? 0;
  const total = BFIA_ALGORITHM_CATALOG.length;

  return (
    <Card className={styles.suite}>
      <div className={styles.hero}>
        <div>
          <Title level={4} className={styles.heroTitle}>
            BFIA 八算法公开样本验证
          </Title>
          <Paragraph type="secondary" className={styles.heroDescription}>
            在隔离环境启动 Alice、Bob
            两方角色进程，以公开样本核验数值结果和协议过程。验证不使用业务项目数据。
          </Paragraph>
        </div>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            loading={loading && !active}
            disabled={active || starting}
            onClick={() => refresh()}
          >
            刷新状态
          </Button>
          <Button
            icon={<FileTextOutlined />}
            disabled={!run || active}
            onClick={openReport}
          >
            查看验证报告
          </Button>
          {(state?.canStart || active || coolingDown) && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={starting}
              disabled={!state?.canStart || active || loading || !!statusError}
              onClick={start}
            >
              一键运行八算法
            </Button>
          )}
        </Space>
      </div>

      <div className={styles.overview}>
        <div className={styles.progressCaption} aria-live="polite">
          <Space wrap>
            <Text strong>本轮进度</Text>
            {statusTag(run?.status)}
          </Space>
          <Text type="secondary">
            {completed}/{total} 已完成 · {passed}/{total} 通过
          </Text>
        </div>
        <Progress
          percent={Math.round((100 * completed) / total)}
          showInfo={false}
          status={
            run?.status === 'FAILED' ? 'exception' : active ? 'active' : undefined
          }
        />
        {run && (
          <Descriptions
            size="small"
            column={{ xs: 1, md: 2, xl: 3 }}
            className={styles.runFacts}
          >
            <Descriptions.Item label="运行 ID">
              <Text copyable>{run.runId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="开始">
              {displayTime(run.startedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="结束">
              {displayTime(run.finishedAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
        {coolingDown && <Text type="secondary">本次运行已结束，稍后可再次运行。</Text>}
        {state && !state.canStart && !active && !coolingDown && (
          <Text type="secondary">请在 Alice 的 BFIA 模式发起验证并查看记录。</Text>
        )}
      </div>

      {statusError && (
        <Alert className={styles.notice} type="error" showIcon message={statusError} />
      )}
      {startError && (
        <Alert className={styles.notice} type="warning" showIcon message={startError} />
      )}
      {run?.message && (
        <Alert
          className={styles.notice}
          type={run.status === 'FAILED' ? 'error' : 'info'}
          showIcon
          message={run.message}
        />
      )}

      <div className={styles.workspace}>
        <aside className={styles.algorithmNav} aria-label="算法目录与运行状态">
          <div className={styles.navTitle}>
            <Text strong>算法清单</Text>
            <Text type="secondary">共 {catalog.length} 项</Text>
          </div>
          <Text type="secondary" className={styles.navLegend}>
            3 项引用 PPCA 开放协议，5 项为项目扩展。
            {paddleDemos.length > 0 && (
              <>
                <br />
                {total} 项 BFIA 可执行 · {paddleDemos.length} 项链桨演示
              </>
            )}
          </Text>
          <ul className={styles.algorithmList}>
            {catalog.map((algorithm) => {
              const chosen = selected.id === algorithm.id;
              return (
                <li key={algorithm.id}>
                  <button
                    type="button"
                    className={styles.algorithmChoice}
                    aria-pressed={chosen}
                    onClick={() => setSelectedId(algorithm.id)}
                  >
                    <span className={styles.algorithmLine}>
                      <Text strong>{algorithm.label}</Text>
                      <RightOutlined className={styles.chevron} />
                    </span>
                    <span className={styles.algorithmBadges}>
                      {'demoLog' in algorithm ? (
                        <Tag color="gold">演示 · 不执行</Tag>
                      ) : (
                        <>
                          {statusTag(
                            run?.algorithms.find((item) => item.id === algorithm.id)
                              ?.status,
                          )}
                          {standardTag(algorithm.standard)}
                        </>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section
          className={styles.algorithmDetail}
          aria-label={`${selected.label} 算法详情`}
        >
          <div className={styles.detailHeader}>
            <Title level={5} className={styles.detailTitle}>
              {selected.label}
            </Title>
            <Space wrap>
              {isDemo ? (
                <Tag color="gold">链桨 · 仅展示</Tag>
              ) : (
                <>
                  <Tag>{selected.runtime}</Tag>
                  {standardTag(selected.standard)}
                  {checkTag('数值', check?.numerical)}
                  {checkTag('协议', check?.protocol)}
                </>
              )}
            </Space>
          </div>
          <Paragraph className={styles.basis} type="secondary">
            {selected.basis}
            {!isDemo && selected.source && (
              <>
                {' '}
                ·{' '}
                <a href={selected.source} target="_blank" rel="noreferrer">
                  查看协议原文
                </a>
              </>
            )}
          </Paragraph>
          <div className={styles.principle}>
            <Text strong>计算原理</Text>
            <Paragraph className={styles.principleCopy}>{selected.summary}</Paragraph>
            <ol className={styles.principleSteps}>
              {selected.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <Text>
              <strong>输出：</strong>
              {selected.output}
            </Text>
          </div>

          {isDemo ? (
            <div className={styles.logSection}>
              <Alert
                className={styles.notice}
                type="info"
                showIcon
                message="以下为静态示例数据和日志。此条目不提交任务，也不计入 BFIA 验证报告。"
              />
              <Text strong>示例数据（虚构）</Text>
              <pre className={styles.reportOutput}>{selected.demoData}</pre>
              <div className={styles.logSection}>
                <Space>
                  <CodeOutlined />
                  <Text strong>示例日志（未实际运行）</Text>
                </Space>
                <pre
                  className={styles.logOutput}
                  tabIndex={0}
                  aria-label="链桨示例日志"
                >
                  {selected.demoLog}
                </pre>
              </div>
            </div>
          ) : (
            <div className={styles.logSection}>
              <Space>
                <CodeOutlined />
                <Text strong>本次运行日志</Text>
              </Space>
              {!run ? (
                empty('运行八算法后，可在这里查看所选算法的 Alice 与 Bob 日志。')
              ) : (
                <Tabs
                  activeKey={party}
                  onChange={setParty}
                  destroyInactiveTabPane
                  size="small"
                  items={(['alice', 'bob'] as const).map((role) => ({
                    key: role,
                    label: role === 'alice' ? 'Alice 日志' : 'Bob 日志',
                    children: (
                      <AlgorithmLogContent
                        key={`${run.runId}/${selected.id}/${role}`}
                        runId={run.runId}
                        algorithm={selected.id}
                        party={role}
                        status={check?.status}
                      />
                    ),
                  }))}
                />
              )}
            </div>
          )}
        </section>
      </div>

      <Modal
        title={report ? `BFIA 验证报告 · ${report.runId}` : 'BFIA 验证报告'}
        open={!!report}
        width={780}
        onCancel={closeReport}
        footer={
          <Space>
            {report?.content && <Button onClick={exportReport}>导出 JSON</Button>}
            <Button type="primary" onClick={closeReport}>
              关闭
            </Button>
          </Space>
        }
      >
        {report?.loading ? (
          <Spin />
        ) : report?.error ? (
          <Alert type="error" showIcon message={report.error} />
        ) : report?.content ? (
          <pre className={styles.reportOutput}>{report.content}</pre>
        ) : null}
      </Modal>
    </Card>
  );
};

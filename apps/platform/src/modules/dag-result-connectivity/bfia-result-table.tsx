import { Space, Table, Tag } from 'antd';
import { CSVLink } from 'react-csv';

/** BFIA returns actual CSV records, not native DomainData field metadata. */
export type InlineTableMeta = {
  format?: string;
  headers: { name: string; type: string }[];
  rows: Record<string, unknown>[];
};

export function isInlineTable(meta?: InlineTableMeta): boolean {
  if (!meta || !Array.isArray(meta.headers) || !Array.isArray(meta.rows)) return false;
  return meta.format === 'csv-records';
}

export function BfiaResultTable({ meta, jobId, outputId }: {
  meta: InlineTableMeta;
  jobId?: string;
  outputId: string;
}) {
  // Spreadsheet applications can interpret CSV strings as formulas.
  const csvRows = meta.rows.map((row) => Object.fromEntries(
    meta.headers.map(({ name }) => {
      const value = String(row[name] ?? '');
      return [name, /^[=+@\-\t\r]/.test(value) ? `'${value}` : value];
    }),
  ));
  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <Tag color="blue">BFIA 计算结果</Tag>
        <span>作业：{jobId}</span>
        <span>共 {meta.rows.length} 行</span>
        <CSVLink
          filename={`${jobId || 'bfia'}-${outputId}.csv`}
          headers={meta.headers.map(({ name }) => ({ label: name, key: name }))}
          data={csvRows}
        >下载结果 CSV</CSVLink>
      </Space>
      <Table
        size="small"
        rowKey={(_, index) => String(index)}
        columns={meta.headers.map(({ name }) => ({ title: name, dataIndex: name, key: name }))}
        dataSource={meta.rows}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}

/** Node IDs are opaque backend identifiers; only legacy IDs encode a number. */
export const parseNodeId = (nodeId: string) => {
  const match = /^(.*)-node-(\d+)$/.exec(nodeId);
  return {
    dagId: match?.[1] || '',
    nodeNum: match ? Number(match[2]) : nodeId,
  };
};

// Local native FATE pair; these are FATE party IDs, not platform node IDs.
export const LOCAL_NATIVE_FATE_CONFIG = JSON.stringify({
  version: '2.0',
  initiator: { node_id: 'JG0100001100000010', party_id: 'JG0100001100000010', role: 'guest' },
  role: { guest: ['JG0100001100000010'], host: ['JG0100001100000000'], arbiter: [] },
  job_params: { common: { sync_type: 'poll' } },
}, null, 2);

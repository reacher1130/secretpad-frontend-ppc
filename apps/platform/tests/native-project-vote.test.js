/* eslint-env jest */
const { pendingProjectVote } = require('../src/modules/p2p-project-list/project-vote');

it('shows the project decision only to the pending institution, not its URL node ID', () => {
  const kimi = { partyId: 'gqxzwemm', action: 'REVIEWING' };
  const project = {
    status: 'REVIEWING',
    initiator: 'rqzvglmu',
    partyVoteInfos: [kimi],
  };

  expect(pendingProjectVote(project, 'gqxzwemm')).toBe(kimi);
  expect(pendingProjectVote(project, 'kimi')).toBeUndefined();
  expect(pendingProjectVote(project, 'rqzvglmu')).toBeUndefined();
  expect(pendingProjectVote(project)).toBeUndefined();
  expect(
    pendingProjectVote({ ...project, status: 'APPROVED' }, 'gqxzwemm'),
  ).toBeUndefined();
});

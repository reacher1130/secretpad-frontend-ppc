export function pendingProjectVote(
  project: Pick<API.ProjectVO, 'status' | 'partyVoteInfos'>,
  institutionId?: string,
) {
  if (!institutionId || project.status !== 'REVIEWING') return undefined;
  return project.partyVoteInfos?.find(
    (party) => party.partyId === institutionId && party.action === 'REVIEWING',
  );
}

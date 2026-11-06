/**
 * Counterpart platform registry used by the demo node list.
 *
 * The protocol switcher belongs to the fixed total-platform shell and must not
 * change that shell. A partner platform is opened from a node row instead. In
 * production the origins are supplied by the deployment; the localhost
 * defaults make the four-node demo directly clickable.
 */

export type PartnerPrivacyProtocol = API.PrivacyProtocol;

export interface PartnerPlatformInfo {
  protocol: PartnerPrivacyProtocol;
  label: string;
  origin: string;
  native: boolean;
}

type NodeLike = {
  srcNode?: {
    nodeId?: string;
    nodeName?: string;
    name?: string;
    privacyProtocol?: string;
    protocolType?: string;
  };
  srcNodeId?: string;
  privacyProtocol?: string;
  protocolType?: string;
};

const labels: Record<PartnerPrivacyProtocol, string> = {
  secretflow: '隐语原生',
  bfia: 'BFIA',
  fate: 'FATE',
  paddledtx: '链桨',
};

const getConfiguredOrigins = (): Partial<Record<PartnerPrivacyProtocol, string>> => {
  const configured = (
    window as Window & {
      __PARTNER_PLATFORM_ORIGINS__?: Partial<
        Record<PartnerPrivacyProtocol, string>
      >;
    }
  ).__PARTNER_PLATFORM_ORIGINS__;
  return configured || {};
};

const getDefaultOrigins = (): Record<PartnerPrivacyProtocol, string> => {
  const protocol = window.location.protocol;
  const host = window.location.hostname;
  return {
    // Kimi runs the upstream SecretPad UI, not the total-platform bundle.
    secretflow: `${protocol}//${host}:38103`,
    // Bob uses the BFIA counterpart page served by the same product build.
    bfia: `${protocol}//${host}:28101`,
    // The FATEBoard service is kept on its own native port.
    fate: `${protocol}//${host}:19383`,
    // dtx-fe is the upstream PaddleDTX UI.
    paddledtx: `${protocol}//${host}:18511`,
  };
};

const normalize = (value: unknown) => String(value || '').trim().toLowerCase();

/**
 * Resolve a privacy protocol from explicit node metadata first. The fallback
 * names are only for the local demo fixtures (kimi, bob, fate, paddle/dtx);
 * the Kuscia transport `protocol` field is deliberately not consulted because
 * it is TLS/NOTLS and is unrelated to the privacy-computing protocol.
 */
export const inferPartnerProtocol = (
  record: NodeLike,
): PartnerPrivacyProtocol | undefined => {
  const explicit = normalize(
    record.privacyProtocol ||
      record.protocolType ||
      record.srcNode?.privacyProtocol ||
      record.srcNode?.protocolType,
  );
  if (
    explicit === 'secretflow' ||
    explicit === 'bfia' ||
    explicit === 'fate' ||
    explicit === 'paddledtx'
  ) {
    return explicit;
  }

  const identity = normalize(
    [
      record.srcNodeId,
      record.srcNode?.nodeId,
      record.srcNode?.nodeName,
      record.srcNode?.name,
    ].join(' '),
  );
  if (identity.includes('bfia') || identity.includes('bob')) return 'bfia';
  if (identity.includes('fate')) return 'fate';
  if (
    identity.includes('paddle') ||
    identity.includes('dtx') ||
    identity.includes('链桨')
  ) {
    return 'paddledtx';
  }
  if (
    identity.includes('secretflow') ||
    identity.includes('secretpad') ||
    identity.includes('kimi')
  ) {
    return 'secretflow';
  }
  return undefined;
};

export const getPartnerPlatform = (
  record: NodeLike,
): PartnerPlatformInfo | undefined => {
  const protocol = inferPartnerProtocol(record);
  if (!protocol) return undefined;
  const origins = { ...getDefaultOrigins(), ...getConfiguredOrigins() };
  return {
    protocol,
    label: labels[protocol],
    origin: origins[protocol],
    native: protocol === 'secretflow' || protocol === 'fate' || protocol === 'paddledtx',
  };
};

export const getPartnerPlatformUrl = (
  record: NodeLike,
  ownerId: string,
): string | undefined => {
  const info = getPartnerPlatform(record);
  if (!info) return undefined;
  const nodeId = encodeURIComponent(String(record.srcNode?.nodeId || record.srcNodeId || ''));
  const encodedOwnerId = encodeURIComponent(ownerId);
  if (info.protocol === 'secretflow') {
    return `${info.origin}/edge?ownerId=${nodeId || encodedOwnerId}&tab=workbench`;
  }
  if (info.protocol === 'paddledtx') {
    // dtx-fe uses /dtx/console as its browser basename.
    return `${info.origin}/dtx/console/`;
  }
  if (info.protocol === 'fate') {
    // FATEBoard is a native Spring Boot UI served from its root path.
    return `${info.origin}/`;
  }
  return `${info.origin}/protocol/${info.protocol}?ownerId=${encodedOwnerId}&nodeId=${nodeId}`;
};

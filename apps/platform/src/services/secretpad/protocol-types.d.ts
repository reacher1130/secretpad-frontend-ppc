/* eslint-disable */

declare namespace API {
  type PrivacyProtocol = 'secretflow' | 'bfia' | 'fate' | 'paddledtx';

  type ProtocolConfigVO = {
    defaultProtocol: PrivacyProtocol;
    canSwitch: boolean;
    activeProtocol: PrivacyProtocol;
    supportedProtocols?: PrivacyProtocol[];
    engineByProtocol?: Record<string, string>;
  };

  type KusciaRestartRequest = {
    protocol: PrivacyProtocol;
  };

  type SecretPadResponse_ProtocolConfigVO_ = {
    status?: SecretPadResponseSecretPadResponseStatus;
    data?: ProtocolConfigVO;
  };
}

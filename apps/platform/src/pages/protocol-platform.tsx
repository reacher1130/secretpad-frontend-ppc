import { useEffect } from 'react';
import { history, useLocation } from 'umi';

import { legacyProtocolHome } from '@/modules/protocol-navigation/navigation';

const ProtocolPlatformPage = () => {
  const { pathname, search } = useLocation();
  useEffect(() => {
    history.replace(legacyProtocolHome(pathname, search));
  }, [pathname, search]);
  return null;
};

export default ProtocolPlatformPage;

import { message } from 'antd';
import React from 'react';
import { history } from 'umi';

import { ReactComponent as Logo } from '@/assets/logo-compact.svg';
import { Platform } from '@/components/platform-wrapper';
import { DefaultComponentInterpreterService } from '@/modules/component-interpreter/component-interpreter-service';
import { DefaultModalManager } from '@/modules/dag-modal-manager';
import platformConfig from '@/platform.config';
import { getModel, Model, useModel } from '@/util/valtio-helper';

import { LoginForm } from './component/login-form';
import type { UserInfo } from './component/login-form';
import styles from './index.less';
import type { User } from './login.service';
import { LoginService } from './login.service';

export const LoginComponent: React.FC = () => {
  const loginModel = useModel(LoginModel);
  return (
    <div className={styles.loginPage}>
      {/* 背景装饰 */}
      <div className={styles.bgDecorationLeft} />
      <div className={styles.bgDecorationRight} />

      {/* 毛玻璃登录卡片 */}
      <div className={styles.glassCard}>
        <div className={styles.logoArea}>
          <Logo className={styles.logo} />
        </div>
        <h1 className={styles.platformTitle}>隐私计算开放互联平台</h1>
        <p className={styles.slogan}>让隐私计算，开放互联</p>
        <LoginForm onConfirm={loginModel.loginConfirm} />
      </div>

      {/* 页脚 */}
      <div className={styles.footer}>
        Privacy Computing Open Interconnection Platform
      </div>
    </div>
  );
};

export class LoginModel extends Model {
  token = '';
  loginService = getModel(LoginService);
  interpreterService = getModel(DefaultComponentInterpreterService);
  modalManager = getModel(DefaultModalManager);

  onViewMount(): void {
    this.modalManager.closeAllModals();
  }

  loginConfirm = async (loginFields: UserInfo) => {
    const { status, data } = await this.loginService.login({
      name: loginFields.name,
      password: loginFields.password,
    });

    const notFirstTimeIn = localStorage.getItem('notFirstTimeIn');
    this.token = data?.token || '';
    this.loginService.userInfo = data as User;
    if (status?.code === 0) {
      localStorage.setItem('User-Token', this.token);
      if (this.loginService.userInfo.platformType === Platform.AUTONOMY) {
        if (this.loginService.userInfo.ownerId) {
          localStorage.setItem('neverLogined', 'true');
          history.push(`/edge?ownerId=${this.loginService.userInfo.ownerId}`);
          message.success('登录成功');
          this.interpreterService.getComponentI18n();
          return;
        }
      }

      if (this.loginService.userInfo.platformType === Platform.EDGE) {
        if (this.loginService.userInfo.ownerId) {
          localStorage.setItem('neverLogined', 'true');
          history.push(`/node?ownerId=${this.loginService.userInfo.ownerId}`);
        }
      } else {
        localStorage.setItem('neverLogined', 'true');
        if (notFirstTimeIn || !platformConfig.guide) {
          history.push('/');
        } else {
          if (
            this.loginService.userInfo.platformType === Platform.CENTER &&
            this.loginService.userInfo?.ownerType === 'EDGE'
          ) {
            history.push('/');
          } else {
            history.push('/guide');
          }
          localStorage.setItem('notFirstTimeIn', 'true');
        }
      }
      message.success('登录成功');
      this.interpreterService.getComponentI18n();
    } else {
      message.error(status?.msg || '登录失败，请检查用户名或密码');
    }
  };
}

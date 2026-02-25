/**
 * useUiProps - Feature 控制器层
 *
 * 模块定位：
 * - 所在层级：Feature 控制器层
 * - 主要目标：拆分点位业务流程与状态编排
 *
 * 关键职责：
 * - 按职责拆分点位业务控制器
 * - 组合状态、动作与生命周期逻辑
 * - 为视图层提供可直接消费的 props/handler
 *
 * 主要导出：
 * - `buildUiProps`
 *
 * 依赖关系：
 * - 上游依赖：`../../../components/AlertModal`、`../../../components/Lightbox`、`../../../types/ui`
 * - 下游影响：供 feature 入口控制器组合
 */

import AlertModal from '../../../components/AlertModal';
import Lightbox from '../../../components/Lightbox';
import { LightboxImage } from '../../../types/ui';

type Params = {
  alertMessage: string | null;
  alertActionLabel: string | null;
  alertAction: (() => void) | null;
  alertSecondaryLabel: string | null;
  alertSecondaryAction: (() => void) | null;
  setAlertMessage: (val: string | null) => void;
  setAlertActionLabel: (val: string | null) => void;
  setAlertAction: (val: (() => void) | null) => void;
  setAlertSecondaryLabel: (val: string | null) => void;
  setAlertSecondaryAction: (val: (() => void) | null) => void;
  viewingImage: LightboxImage | null;
  setViewingImage: (v: LightboxImage | null) => void;
};

export function buildUiProps(params: Params): {
  alertProps: React.ComponentProps<typeof AlertModal>;
  lightboxProps: React.ComponentProps<typeof Lightbox>;
} {
  return {
    alertProps: {
      message: params.alertMessage,
      actionLabel: params.alertActionLabel ?? null,
      onAction: params.alertAction ?? null,
      secondaryLabel: params.alertSecondaryLabel ?? null,
      onSecondary: params.alertSecondaryAction ?? null,
      onClose: () => {
        params.setAlertMessage(null);
        params.setAlertActionLabel(null);
        params.setAlertAction(null);
        params.setAlertSecondaryLabel(null);
        params.setAlertSecondaryAction(null);
      },
    },
    lightboxProps: {
      viewingImage: params.viewingImage,
      setViewingImage: params.setViewingImage,
    },
  };
}

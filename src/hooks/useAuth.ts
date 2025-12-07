// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchUserApi, upsertUserApi } from '../services/users';

const LOCAL_USER_KEY = 'valpoint_user_id';
const LOCAL_USER_MODE_KEY = 'valpoint_user_mode';
const ID_LENGTH = 8;
const ID_REGEX = /^[A-Za-z0-9]{8}$/;

const generateRandomUserId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const arr = crypto.getRandomValues(new Uint32Array(ID_LENGTH));
  let out = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    out += chars[arr[i] % chars.length];
  }
  return out;
};

type Params = {
  onAuthSuccess: (userId: string) => Promise<void> | void;
  setAlertMessage: (msg: string | null) => void;
};

export const useAuth = ({ onAuthSuccess, setAlertMessage }: Params) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userMode, setUserMode] = useState<'login' | 'guest'>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');
  const [customUserIdInput, setCustomUserIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const isGuest = userMode === 'guest';
  const targetUserId = pendingUserId || customUserIdInput || userId || '';

  useEffect(() => {
    const savedId = localStorage.getItem(LOCAL_USER_KEY);
    const savedMode = localStorage.getItem(LOCAL_USER_MODE_KEY);
    if (savedId && ID_REGEX.test(savedId)) {
      setUserId(savedId);
      setCustomUserIdInput(savedId);
      const mode = savedMode === 'guest' ? 'guest' : 'login';
      setUserMode(mode);
    } else {
      const newId = generateRandomUserId();
      setPendingUserId(newId);
      setCustomUserIdInput(newId);
      setIsAuthModalOpen(true);
    }
  }, []);

  const openAuthModalForId = useCallback((id: string) => {
    setPendingUserId(id);
    setPasswordInput('');
    setIsAuthModalOpen(true);
  }, []);

  const handleApplyCustomUserId = useCallback(() => {
    const trimmed = customUserIdInput.trim().toUpperCase();
    if (!ID_REGEX.test(trimmed)) {
      setAlertMessage('ID 必须是 8 位字母或数字（不区分大小写）');
      return;
    }
    openAuthModalForId(trimmed);
  }, [customUserIdInput, openAuthModalForId, setAlertMessage]);

  const handleResetUserId = useCallback(() => {
    const newId = generateRandomUserId();
    setCustomUserIdInput(newId);
    openAuthModalForId(newId);
  }, [openAuthModalForId]);

  const handleConfirmUserAuth = useCallback(
    async (forcedPassword: string | null = null) => {
      const finalId = (pendingUserId || customUserIdInput || '').trim().toUpperCase();
      if (!ID_REGEX.test(finalId)) {
        setAlertMessage('ID 必须是 8 位字母或数字（不区分大小写）');
        return;
      }
      const password = forcedPassword !== null ? forcedPassword.trim() : passwordInput.trim();
      const nextMode = password ? 'login' : 'guest';
      setIsAuthLoading(true);
      try {
        if (nextMode === 'login') {
          const { data, error } = await fetchUserApi(finalId);
          if (error) throw error;
          const existing = data?.[0];
          if (existing && existing.password && existing.password !== password) {
            setAlertMessage('密码不正确，请重新输入。');
            setIsAuthLoading(false);
            return;
          }
          const now = new Date().toISOString();
          const { error: upsertError } = await upsertUserApi({
            user_id: finalId,
            password,
            created_at: existing?.created_at || now,
            updated_at: now,
          });
          if (upsertError) throw upsertError;
        }

        localStorage.setItem(LOCAL_USER_KEY, finalId);
        localStorage.setItem(LOCAL_USER_MODE_KEY, nextMode);
        setUserId(finalId);
        setCustomUserIdInput(finalId);
        setUserMode(nextMode);
        setIsAuthModalOpen(false);
        setPendingUserId('');
        await onAuthSuccess(finalId);
      } catch (e) {
        console.error(e);
        setAlertMessage('保存账号信息失败，请稍后重试');
      } finally {
        setIsAuthLoading(false);
      }
    },
    [pendingUserId, customUserIdInput, passwordInput, setAlertMessage, onAuthSuccess],
  );

  return {
    userId,
    setUserId,
    userMode,
    setUserMode,
    isGuest,
    isAuthModalOpen,
    setIsAuthModalOpen,
    pendingUserId,
    setPendingUserId,
    customUserIdInput,
    setCustomUserIdInput,
    passwordInput,
    setPasswordInput,
    isAuthLoading,
    targetUserId,
    openAuthModalForId,
    handleApplyCustomUserId,
    handleResetUserId,
    handleConfirmUserAuth,
  };
};

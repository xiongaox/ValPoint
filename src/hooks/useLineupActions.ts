// @ts-nocheck
import { saveLineupApi, updateLineupApi, deleteLineupApi, clearLineupsApi } from '../services/lineups';

export const useLineupActions = () => {
  const saveNewLineup = async (payload: any) => {
    await saveLineupApi(payload);
  };

  const updateLineup = async (id: string, payload: any) => {
    await updateLineupApi(id, payload);
  };

  const deleteLineup = async (id: string) => {
    await deleteLineupApi(id);
  };

  const clearLineups = async (userId: string) => {
    await clearLineupsApi(userId);
  };

  return { saveNewLineup, updateLineup, deleteLineup, clearLineups };
};

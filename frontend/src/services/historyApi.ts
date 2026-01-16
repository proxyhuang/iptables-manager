import { apiClient } from './api';
import { History } from '../types/history';

export const getHistory = (limit: number = 50, offset: number = 0) => {
  return apiClient.get<History[]>(`/history?limit=${limit}&offset=${offset}`);
};

export const getHistoryById = (id: number) => {
  return apiClient.get<History>(`/history/${id}`);
};

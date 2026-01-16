import { apiClient } from './api';
import { TrafficStats, RuleStats } from '../types/stats';

export const getTrafficStats = () => {
  return apiClient.get<TrafficStats>('/stats/traffic');
};

export const getRuleStats = () => {
  return apiClient.get<RuleStats>('/stats/rules');
};

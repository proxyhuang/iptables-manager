import { apiClient } from './api';
import { Rule, RuleCreateRequest, RuleDeleteRequest } from '../types/rule';

export const getRules = () => {
  return apiClient.get<Rule[]>('/rules');
};

export const getRulesByTable = (table: string) => {
  return apiClient.get<Rule[]>(`/rules/${table}`);
};

export const addRule = (request: RuleCreateRequest) => {
  return apiClient.post('/rules', request);
};

export const deleteRule = (request: RuleDeleteRequest) => {
  return apiClient.delete('/rules', { data: request });
};

export const searchRules = (query: string) => {
  return apiClient.get<Rule[]>(`/rules/search?q=${encodeURIComponent(query)}`);
};

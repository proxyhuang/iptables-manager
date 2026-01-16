import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TrafficStats, RuleStats } from '../../types/stats';

interface StatsState {
  trafficStats: TrafficStats | null;
  ruleStats: RuleStats | null;
  trafficHistory: TrafficStats[];
  maxHistoryLength: number;
}

const initialState: StatsState = {
  trafficStats: null,
  ruleStats: null,
  trafficHistory: [],
  maxHistoryLength: 50,
};

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    updateTrafficStats: (state, action: PayloadAction<TrafficStats>) => {
      state.trafficStats = action.payload;
      state.trafficHistory.push(action.payload);

      if (state.trafficHistory.length > state.maxHistoryLength) {
        state.trafficHistory.shift();
      }
    },
    updateRuleStats: (state, action: PayloadAction<RuleStats>) => {
      state.ruleStats = action.payload;
    },
    clearTrafficHistory: (state) => {
      state.trafficHistory = [];
    },
  },
});

export const { updateTrafficStats, updateRuleStats, clearTrafficHistory } = statsSlice.actions;
export default statsSlice.reducer;

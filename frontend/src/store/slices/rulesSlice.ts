import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Rule, RuleCreateRequest, RuleDeleteRequest } from '../../types/rule';
import * as rulesApi from '../../services/rulesApi';

interface RulesState {
  rules: Rule[];
  filteredRules: Rule[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedTable: string;
  selectedChain: string;
}

const initialState: RulesState = {
  rules: [],
  filteredRules: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedTable: 'all',
  selectedChain: 'all',
};

const filterRules = (rules: Rule[], table: string, chain: string): Rule[] => {
  return rules.filter((rule) => {
    const tableMatch = table === 'all' || rule.table === table;
    const chainMatch = chain === 'all' || rule.chain === chain;
    return tableMatch && chainMatch;
  });
};

export const fetchRules = createAsyncThunk(
  'rules/fetchRules',
  async () => {
    const response = await rulesApi.getRules();
    return response.data;
  }
);

export const addRule = createAsyncThunk(
  'rules/addRule',
  async (request: RuleCreateRequest) => {
    await rulesApi.addRule(request);
    const response = await rulesApi.getRules();
    return response.data;
  }
);

export const deleteRule = createAsyncThunk(
  'rules/deleteRule',
  async (request: RuleDeleteRequest) => {
    await rulesApi.deleteRule(request);
    const response = await rulesApi.getRules();
    return response.data;
  }
);

export const searchRules = createAsyncThunk(
  'rules/searchRules',
  async (query: string) => {
    if (query.trim() === '') {
      const response = await rulesApi.getRules();
      return response.data;
    }
    const response = await rulesApi.searchRules(query);
    return response.data;
  }
);

const rulesSlice = createSlice({
  name: 'rules',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedTable: (state, action: PayloadAction<string>) => {
      state.selectedTable = action.payload;
      state.filteredRules = filterRules(state.rules, action.payload, state.selectedChain);
    },
    setSelectedChain: (state, action: PayloadAction<string>) => {
      state.selectedChain = action.payload;
      state.filteredRules = filterRules(state.rules, state.selectedTable, action.payload);
    },
    updateRulesFromWS: (state, action: PayloadAction<Rule[]>) => {
      state.rules = action.payload;
      state.filteredRules = filterRules(action.payload, state.selectedTable, state.selectedChain);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRules.fulfilled, (state, action) => {
        state.loading = false;
        state.rules = action.payload;
        state.filteredRules = filterRules(action.payload, state.selectedTable, state.selectedChain);
      })
      .addCase(fetchRules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch rules';
      })
      .addCase(addRule.fulfilled, (state, action) => {
        state.rules = action.payload;
        state.filteredRules = filterRules(action.payload, state.selectedTable, state.selectedChain);
      })
      .addCase(deleteRule.fulfilled, (state, action) => {
        state.rules = action.payload;
        state.filteredRules = filterRules(action.payload, state.selectedTable, state.selectedChain);
      })
      .addCase(searchRules.fulfilled, (state, action) => {
        state.filteredRules = action.payload;
      });
  },
});

export const { setSearchQuery, setSelectedTable, setSelectedChain, updateRulesFromWS } = rulesSlice.actions;
export default rulesSlice.reducer;

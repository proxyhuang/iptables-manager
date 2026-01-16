// Mock for recharts
const React = require('react');

const createMockComponent = (name) => {
  const Component = ({ children, ...props }) =>
    React.createElement('div', { 'data-testid': `recharts-${name.toLowerCase()}`, ...props }, children);
  Component.displayName = name;
  return Component;
};

module.exports = {
  LineChart: createMockComponent('LineChart'),
  Line: createMockComponent('Line'),
  BarChart: createMockComponent('BarChart'),
  Bar: createMockComponent('Bar'),
  AreaChart: createMockComponent('AreaChart'),
  Area: createMockComponent('Area'),
  PieChart: createMockComponent('PieChart'),
  Pie: createMockComponent('Pie'),
  Cell: createMockComponent('Cell'),
  XAxis: createMockComponent('XAxis'),
  YAxis: createMockComponent('YAxis'),
  CartesianGrid: createMockComponent('CartesianGrid'),
  Tooltip: createMockComponent('Tooltip'),
  Legend: createMockComponent('Legend'),
  ResponsiveContainer: ({ children }) => React.createElement('div', { 'data-testid': 'recharts-responsive-container' }, children),
  ComposedChart: createMockComponent('ComposedChart'),
  ScatterChart: createMockComponent('ScatterChart'),
  Scatter: createMockComponent('Scatter'),
  RadarChart: createMockComponent('RadarChart'),
  Radar: createMockComponent('Radar'),
  RadialBarChart: createMockComponent('RadialBarChart'),
  RadialBar: createMockComponent('RadialBar'),
  Treemap: createMockComponent('Treemap'),
  Funnel: createMockComponent('Funnel'),
  FunnelChart: createMockComponent('FunnelChart'),
  Sankey: createMockComponent('Sankey'),
  ReferenceLine: createMockComponent('ReferenceLine'),
  ReferenceDot: createMockComponent('ReferenceDot'),
  ReferenceArea: createMockComponent('ReferenceArea'),
  Brush: createMockComponent('Brush'),
  ErrorBar: createMockComponent('ErrorBar'),
  LabelList: createMockComponent('LabelList'),
  PolarGrid: createMockComponent('PolarGrid'),
  PolarAngleAxis: createMockComponent('PolarAngleAxis'),
  PolarRadiusAxis: createMockComponent('PolarRadiusAxis'),
};

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';

test('renders login page when not authenticated', () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );
  // With mocked antd components, check for text content and data-testid attributes
  expect(screen.getByText(/IPTABLES MANAGER/i)).toBeInTheDocument();
  expect(screen.getByText(/ACCESS SYSTEM/i)).toBeInTheDocument();
  expect(screen.getByTestId('antd-button')).toBeInTheDocument();
  expect(screen.getByTestId('antd-input')).toBeInTheDocument();
  expect(screen.getByTestId('antd-password')).toBeInTheDocument();
});

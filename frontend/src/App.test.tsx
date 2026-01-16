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
  const loginElement = screen.getByText(/Login/i);
  expect(loginElement).toBeInTheDocument();
});

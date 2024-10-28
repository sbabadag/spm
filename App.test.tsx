import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import App from './App';

test('renders correctly and allows editing of fields', () => {
  const { getByText, getByPlaceholderText } = render(<App />);

  // Check if the "Add New Record" button is present
  const addButton = getByText('Add New Record');
  expect(addButton).toBeTruthy();

  // Add a new record
  fireEvent.press(addButton);

  // Check if the new record is added and fields are editable
  const projectNameInput = getByPlaceholderText('Project Name');
  const quantityDoneInput = getByPlaceholderText('Quantity Done');
  const posnoInput = getByPlaceholderText('POSNO');

  expect(projectNameInput).toBeTruthy();
  expect(quantityDoneInput).toBeTruthy();
  expect(posnoInput).toBeTruthy();

  // Edit the fields
  fireEvent.changeText(projectNameInput, 'Updated Project');
  fireEvent.changeText(quantityDoneInput, '10');
  fireEvent.changeText(posnoInput, '1234');

  // Check if the fields are updated
  expect(projectNameInput.props.value).toBe('Updated Project');
  expect(quantityDoneInput.props.value).toBe('10');
  expect(posnoInput.props.value).toBe('1234');
});
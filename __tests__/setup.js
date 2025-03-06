// setup.js
import '@testing-library/jest-native/extend-expect';

// Add any global test setup here

// Add a minimal test to satisfy Jest's requirement
describe('Setup', () => {
  it('should set up the testing environment correctly', () => {
    expect(true).toBe(true);
  });
});
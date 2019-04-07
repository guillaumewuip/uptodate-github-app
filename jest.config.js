module.exports = {
  roots: [
    '<rootDir>/src/',
    '<rootDir>/test/',
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.[tj]sx?$',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
};

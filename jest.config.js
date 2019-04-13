module.exports = {
  roots: [
    '<rootDir>/src/',
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '.*\\.test\\.ts$',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  globals: {
    'ts-jest': {
      diagnostics: {
        pretty: true,
      },
    },
  },
};

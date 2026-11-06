module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: {
    '^.+\\.tsx?$': [
      require.resolve('ts-jest', { paths: [require.resolve('../../tooling/jest/package.json')] }),
      { isolatedModules: true, diagnostics: false, tsconfig: { module: 'commonjs', target: 'es2020' } },
    ],
  },
};

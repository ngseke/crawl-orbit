module.exports = {
  extends: 'standard-with-typescript',
  parserOptions: {
    project: './tsconfig.json',
  },
  ignorePatterns: ['dist'],
  rules: {
    '@typescript-eslint/comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'only-multiline',
    }],
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-floating-promises': 0,
    '@typescript-eslint/promise-function-async': 0,
    '@typescript-eslint/no-misused-promises': 0,
    '@typescript-eslint/strict-boolean-expressions': 0,
  },
}

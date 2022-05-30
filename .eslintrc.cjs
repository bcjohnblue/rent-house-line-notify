module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'import/no-unresolved': [2, { ignore: ['^#[\\w\\d\\-]+$'] }],
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'no-console': 'off'
  },
};

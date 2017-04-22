module.exports = {
  extends: 'airbnb',
  env: {
    node: true,
    jest: true,
  },
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
    'indent': ['error', 2, { SwitchCase: 0 }],
    'no-console': ['off'],
    'padded-blocks': ['off'],
    'quote-props': ['error', 'as-needed'],
    'space-unary-ops': ['error', {
      words: true,
      nonwords: false,
      overrides: {
        '!': true
      }
    }],
    'strict': ['off'],
    'max-len': ['off'],
    quotes: ['error', 'single', { allowTemplateLiterals: true }],
    'space-before-function-paren': ['error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'ignore'
    }],
    'no-shadow': ['off'],
    'space-in-parens': ['error', 'always', { exceptions: ['{}', '[]', 'empty'] }],
    'computed-property-spacing': ['error', 'always'],
    'arrow-parens': ['error', 'as-needed', {
      requireForBlockBody: true
    }],

    'import/no-extraneous-dependencies': ['error', { devDependencies: [
      // only allow devDependencies in these folders:
      '*.js',
      '**/__tests__/*',
      'jest/**/*',
      '**/*.stories.jsx',
      '.storybook/**/*'
    ] }],
  }
};

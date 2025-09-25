const { whenDev } = require('@craco/craco');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add Babel loader for OpenAI package
      const babelLoaderRule = webpackConfig.module.rules[1];
      if (babelLoaderRule) {
        babelLoaderRule.include = [
          ...(babelLoaderRule.include || []),
          /node_modules[\\/]openai[\\/]/
        ];
      }
      return webpackConfig;
    },
  },
  babel: {
    presets: [
      ['@babel/preset-env', { 
        targets: { 
          node: 'current',
          browsers: ['>0.2%', 'not dead', 'not ie <= 11', 'not op_mini all']
        },
        useBuiltIns: 'entry',
        corejs: 3,
      }],
      '@babel/preset-react',
      '@babel/preset-typescript'
    ],
    plugins: [
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-object-rest-spread',
      '@babel/plugin-syntax-dynamic-import',
      whenDev(() => 'react-refresh/babel', [])
    ].filter(Boolean)
  },
  typescript: {
    enableTypeChecking: true
  }
};

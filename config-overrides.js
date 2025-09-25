module.exports = function override(config, env) {
  // Add a rule to handle the OpenAI package
  config.module.rules.push({
    test: /node_modules\/openai\/.*\.m?js$/,
    type: 'javascript/auto',
    resolve: {
      fullySpecified: false,
    },
  });

  return config;
};

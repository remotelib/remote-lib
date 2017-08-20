const envOpts = {
  loose: true,
};

module.exports = {
  presets: [
    ['env', envOpts],
  ],
  env: {
    cov: {
      auxiliaryCommentBefore: 'istanbul ignore next',
      plugins: ['istanbul'],
    }
  },
};

if (process.env.BABEL_ENV === 'development') {
  envOpts.targets = {
    node: 'current',
  };
  envOpts.debug = true;
}

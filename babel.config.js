module.exports = (api) => {
  api.cache(process.env.NODE_ENV === 'development')
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          useBuiltIns: 'usage',
          corejs: 'core-js@3',
          targets: { node: 'current' },
        },
      ],
      '@babel/preset-typescript',
      '@babel/preset-react',
    ],
    plugins: [
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-object-rest-spread',
      [
        'emotion',
        {
          // sourceMap is on by default but source maps are dead code eliminated in production
          sourceMap: true,
          autoLabel: process.env.NODE_ENV !== 'production',
          labelFormat: '[local]',
          cssPropOptimization: true,
        },
      ],
    ],
    // env: {
    //   test: {
    //     plugins: ['macros']
    //   }
    // }
  }
}

const isDev = process.env.NODE_ENV !== 'development'

module.exports = (api) => {
  api.cache(isDev)
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
        'babel-plugin-styled-components',
        {
          minify: !isDev,
          transpileTemplateLiterals: !isDev,
          pure: !isDev,
          ssr: false,
          displayName: isDev,
          fileName: isDev,
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

module.exports = (api) => {
  api.cache(process.env.NODE_ENV === "development");
  return {
    presets: [
      [
        "@babel/preset-env",
        {
          useBuiltIns: "usage",
          corejs: "core-js@3",
          targets: { node: "current" },
        },
      ],
      "@babel/preset-typescript",
      // '@babel/preset-react'
    ],
    plugins: [
      "@babel/plugin-syntax-dynamic-import",
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-object-rest-spread",
      // 'babel-plugin-styled-components'
    ],
    // env: {
    //   test: {
    //     plugins: ['macros']
    //   }
    // }
  };
};

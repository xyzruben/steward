// ============================================================================
// BABEL CONFIGURATION (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Babel configuration for Jest ESM module support

module.exports = {
  presets: [
    [
      'next/babel',
      {
        'preset-env': {
          targets: {
            node: 'current',
          },
          modules: 'commonjs', // Force CommonJS for Jest compatibility
        },
        'preset-react': {
          runtime: 'automatic',
        },
        'preset-typescript': {
          isTSX: true,
          allExtensions: true,
        },
      },
    ],
  ],
  plugins: [
    // Handle ESM imports in CommonJS environment
    ['@babel/plugin-transform-modules-commonjs', { loose: true }],
  ],
  env: {
    test: {
      plugins: [
        // Ensure proper module transformation in test environment
        ['@babel/plugin-transform-modules-commonjs', { loose: true }],
      ],
    },
  },
} 
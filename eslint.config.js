import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import globals from 'globals'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**']
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': ['error', { ignoreRestSiblings: true }]
    }
  },
  {
    files: ['src/components/Icon.vue', 'src/main.js'],
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  },
  skipFormatting
]

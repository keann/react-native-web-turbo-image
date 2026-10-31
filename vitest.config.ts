import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: 'unit',
                    include: ['src/**/*.test.{ts,tsx}'],
                },
            },
            {
                test: {
                    name: 'smoke',
                    include: ['tests/smoke/**/*.test.ts'],
                },
            },
            {
                plugins: [storybookTest({ configDir: '.storybook' })],
                test: {
                    name: 'stories',
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: playwright(),
                        instances: [{ browser: 'chromium' }],
                    },
                },
            },
        ],
    },
})

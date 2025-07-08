import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ['@wxt-dev/module-vue'],

	// @ts-ignore
	vite() {
		return {
			plugins: [tailwindcss()],
		}
	},
})

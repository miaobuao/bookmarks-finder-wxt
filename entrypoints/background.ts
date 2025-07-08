import { registerProcedure } from '@/procedure'

export default defineBackground(() => {
	registerProcedure()
	console.log('Hello background!', { id: browser.runtime.id })
})

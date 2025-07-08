import { defineProxyService } from '@webext-core/proxy-service'

export const [registerProcedure, useProcedure] = defineProxyService(
	'procedure',
	() => {
		return {}
	},
)

import { flattenBookmarksTree } from '@/utils/flatten-bookmarks-tree'
import { FeatureExtractionPipeline, pipeline } from '@huggingface/transformers'
import { defineProxyService } from '@webext-core/proxy-service'
import { dbPromise } from './db'

let pipe: FeatureExtractionPipeline | null = null
async function getPipeline(): Promise<FeatureExtractionPipeline> {
	if (pipe === null) {
		const _p = await pipeline(
			'feature-extraction',
			'jinaai/jina-embeddings-v2-base-zh',
		)
		pipe = _p
	}
	return pipe
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
	const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
	const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
	const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
	if (magnitudeA === 0 || magnitudeB === 0) {
		return 0
	}
	return dotProduct / (magnitudeA * magnitudeB)
}

export const [registerProcedure, useProcedure] = defineProxyService(
	'procedure',
	() => {
		return {
			async triggerEmbedding(force: boolean = false) {
				const pipe = await getPipeline()
				const db = await dbPromise
				const allBookmarks = flattenBookmarksTree(
					await browser.bookmarks.getTree(),
				)

				for (const bookmark of allBookmarks) {
					if (!bookmark.url || !bookmark.id) continue

					if (!force) {
						const existing = await db.get('bookmarks', bookmark.id)
						if (existing) continue
					}

					const embedding = await pipe(bookmark.title, {
						pooling: 'mean',
						normalize: true,
					})
					const vector = Array.from(embedding.data as Float32Array)

					await db.put('bookmarks', {
						id: bookmark.id,
						title: bookmark.title,
						url: bookmark.url,
						vector: vector,
						parentId: bookmark.parentId,
						dateAdded: bookmark.dateAdded,
					})
				}
				console.log('Embedding process completed.')
				return true
			},

			async searchBookmarks(query: string, topK: number = 10) {
				const pipe = await getPipeline()
				const db = await dbPromise

				const queryEmbedding = await pipe(query, {
					pooling: 'mean',
					normalize: true,
				})
				const queryVector = Array.from(queryEmbedding.data as Float32Array)

				const allBookmarkVectors = await db.getAll('bookmarks')
				if (!allBookmarkVectors.length) return []

				const similarities = allBookmarkVectors.map((bookmark) => ({
					...bookmark,
					similarity: cosineSimilarity(queryVector, bookmark.vector),
				}))

				similarities.sort((a, b) => b.similarity - a.similarity)
				return similarities.slice(0, topK)
			},

			async getStats() {
				const db = await dbPromise
				const totalBookmarks = flattenBookmarksTree(
					await browser.bookmarks.getTree(),
				).filter((b) => b.url).length
				const indexedBookmarks = await db.count('bookmarks')
				return { totalBookmarks, indexedBookmarks }
			},
		}
	},
)

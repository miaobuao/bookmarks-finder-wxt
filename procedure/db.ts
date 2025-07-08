import { DBSchema, openDB } from 'idb'

export interface BookmarkVector {
	id: string // bookmark.id
	title: string
	url: string
	vector: number[]
	parentId?: string
	dateAdded?: number
}

interface MyDb extends DBSchema {
	bookmarks: {
		key: string
		value: BookmarkVector
		indexes: { 'by-id': string }
	}
}

export const dbPromise = openDB<MyDb>('bookmarks-db', 1, {
	upgrade(db) {
		const store = db.createObjectStore('bookmarks', {
			keyPath: 'id',
		})
		store.createIndex('by-id', 'id')
	},
})

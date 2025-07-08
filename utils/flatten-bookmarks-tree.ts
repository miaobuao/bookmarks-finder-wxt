export function flattenBookmarksTree(
	tree: Browser.bookmarks.BookmarkTreeNode[],
) {
	const bookmarks: Browser.bookmarks.BookmarkTreeNode[] = []

	function traverse(nodes: Browser.bookmarks.BookmarkTreeNode[]) {
		for (const node of nodes) {
			if (node.url) {
				bookmarks.push(node)
			}
			if (node.children) {
				traverse(node.children)
			}
		}
	}

	traverse(tree)
	return bookmarks
}

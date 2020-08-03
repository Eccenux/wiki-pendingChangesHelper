// ==UserScript==
// @name         Wiki Pending Changes Helper
// @namespace    pl.enux.wiki
// @version      0.4.2
// @description  [0.4.2] Pomocnik do przeglądania strona na Wikipedii.
// @author       Nux; Beau; Matma Rex
// @match        https://pl.wikipedia.org/*
// @grant        none
// @updateURL    https://github.com/Eccenux/wiki-pendingChangesHelper/raw/master/pendingChangesHelper.meta.js
// @downloadURL  https://github.com/Eccenux/wiki-pendingChangesHelper/raw/master/pendingChangesHelper.user.js
// ==/UserScript==

window.nuxPendingChangesGadgetWrapper = function (mw) {
	// wrapper start

	//console.log('pendingChangesGadget executing...', mw, Object.keys(mw));

	var pendingChangesGadget = {
		version: 4,
		limit: 5,
		openCaption: 'Otwórz pierwsze $number stron do przejrzenia',
		openUnwatchedCaption: 'Pierwsze $number czerwonych (nieobserwowanych)',
		allDoneInfo: 'Koniec 😎',
		specialPage: '',

		/**
		 * Main init.
		 */
		init: function () {
			var specialPage = mw.config.get('wgCanonicalSpecialPageName');
			//console.log('pendingChangesGadget init:', specialPage);
			if (!specialPage) {
				return;
			}
			if (
				specialPage != 'PendingChanges' &&
				specialPage != 'Newpages' &&
				specialPage != 'Contributions' &&
				specialPage != 'Watchlist'
			) {
				return;
			}
			this.specialPage = specialPage;

			this.createActions();
		},

		/**
		 * Create actions.
		 */
		createActions: function () {
			var list;
			if (this.specialPage != 'Watchlist') {
				list = this.getList();
			} else {
				list = document.querySelector('.mw-changeslist ul');
			}
			if (!list) {
				return;
			}
			var p = document.createElement('p');

			this.createMainButton(p);

			if (this.specialPage == 'PendingChanges' && this.hasUnwatchedPages()) {
				p.appendChild(document.createTextNode(' • '));
				this.createUnwatchedButton(p);
			} else if (this.specialPage == 'Contributions' && !this.hasPendingContributions()) {
				p.style.textDecoration = 'line-through';
			}

			list.parentNode.insertBefore(p, list);
		},
		/**
		 * Create main action button.
		 * @param {Element} container Container to which the button is to be added.
		 */
		createMainButton: function (container) {
			var callback = () => {
				this.openPages();
				return false;
			};

			var caption = this.openCaption.replace('$number', this.limit);

			this.createPortletButton(caption, 'portlet-open-ten-pages', callback);
			this.createButton(caption, container, callback);
		},

		/**
		 * Generic Action Portlet.
		 * @param {String} caption Label.
		 * @param {String} portletId Uniqued ID.
		 * @param {Function} callback Click action.
		 */
		createPortletButton: function (caption, portletId, callback) {
			mw.util.addPortletLink(
				'p-cactions',
				'#',
				caption,
				portletId
			);
			var portlet = document.getElementById(portletId);
			if (portlet) {
				portlet.onclick = callback;
			}
		},

		/**
		 * Generic List Button.
		 * @param {String} caption Label.
		 * @param {Element} container Container to which the button is to be added.
		 * @param {Function} callback Click action.
		 */
		createButton: function (caption, container, callback) {
			var a = document.createElement('a');
			a.style.fontWeight = 'bold';
			a.href = '#';
			a.onclick = callback;
			a.appendChild(document.createTextNode(caption));

			container.appendChild(a);
		},

		/**
		 * Create unwatched items button.
		 * @param {Element} container Container to which the button is to be added.
		 */
		createUnwatchedButton: function (list) {
			var callback = () => {
				this.openUnwatchedPages();
				return false;
			};

			var caption = this.openUnwatchedCaption.replace('$number', this.limit);

			this.createButton(caption, list, callback);
		},

		/**
		 * List items container.
		 * @return null when list was not found.
		 */
		getList: function () {
			var list = document.querySelector('#mw-content-text ul');
			return list;
		},

		/**
		 * Main button action.
		 */
		openPages: function () {
			var didSome = true;
			switch (this.specialPage) {
				case 'PendingChanges':
					didSome = this.openPendingChanges();
					break;
				case 'Newpages':
					didSome = this.openNewPages();
					break;
				case 'Contributions':
					didSome = this.openContributions();
					break;
				case 'Watchlist':
					didSome = this.openWatchedPages();
					break;
				default:
					console.warn('Unsupported page');
					break;
			}
			if (!didSome) {
				alert(this.allDoneInfo);
			}
		},

		hasPendingContributions: function () {
			var listItems = document.querySelectorAll('li.flaggedrevs-pending');
			if (!listItems.length) {
				return false;
			}
			return true;
		},
		/**
		 * Special:Contributions
		 */
		openContributions: function () {
			var listItems = document.querySelectorAll('li.flaggedrevs-pending:not(.visited)');
			if (!listItems.length) {
				return;
			}
			// find unique URLs (title.href -> diff.href)
			const uniques = {};
			let lastIndex = -1;
			for (let index = 0; index < listItems.length; index++) {
				const item = listItems[index];
				lastIndex = index;
				if (this.wasVisited(item)) {
					continue;
				}
				let id = item.querySelector('.mw-contributions-title').href;
				//var oid = item.getAttribute('data-mw-revid');
				let diff = item.querySelector('.mw-changeslist-diff').href;
				uniques[id] = diff;

				this.markAsVisited(item);
				if (Object.keys(uniques).length >= this.limit) {
					break;
				}
			}

			// mark found to the end of the list
			for (let index = lastIndex + 1; index < listItems.length; index++) {
				const item = listItems[index];
				lastIndex = index;
				if (this.wasVisited(item)) {
					continue;
				}
				let id = item.querySelector('.mw-contributions-title').href;
				if (id in uniques) {
					this.markAsVisited(item);
				}
			}

			// open found
			this.openDiffs(uniques);

			return Object.keys(uniques).length > 0;
		},
		/**
		 * Open generic diff urls as las-flagged diff.
		 * @param urls Url map (keys not important).
		 */
		openDiffs: async function (urls) {
			// resolve URLs from the MW API.
			const reviewUrls = [];
			for (const i in urls) {
				if (!urls.hasOwnProperty(i)) {
					continue;
				}
				let url = urls[i];

				// get stable revision id
				let title = url.replace(/.+[?&]title=([^&]+).*/, '$1');
				let data = await fetch(
					`/w/api.php?action=query&prop=info%7Cflagged&titles=${title}&format=json`
				);
				//var json = await data.json();
				let text = await data.text();
				let oid = -1;
				text.replace(/"stable_revid":(\d+)/, (a, rev) => {
					oid = rev;
				});

				// push
				reviewUrls.push(
					`/w/index.php?title=${title}&diff=cur&oldid=${oid}`
				);
			}

			// open found URLs
			for (var i = 0; i < reviewUrls.length; i++) {
				let url = reviewUrls[i];
				//console.log(url);
				window.open(url);
			}
		},

		/**
		 * Special:Newpages
		 */
		openNewPages: function () {
			var listItems = this.getList().querySelectorAll('li');
			if (!listItems.length) return;

			var i = 0;
			var done = 0;

			while (i < listItems.length && done < this.limit) {
				var item = listItems[i];
				i++;

				if (this.wasVisited(item)) continue;

				if (!item.classList.contains('not-patrolled')) continue;

				var link = item.querySelectorAll('a.mw-newpages-pagename');

				if (!link.length) continue;

				window.open(link[0].href);
				this.markAsVisited(item);

				done++;
			}
			return done > 0;
		},

		/**
		 * Special:PendingChanges
		 */
		openPendingChanges: function () {
			var listItems = this.getList().querySelectorAll('li');
			if (!listItems.length) return;

			return this.openPendingItems(listItems);
		},

		/**
		 * Open items from PendingChanges.
		 */
		openPendingItems: function (listItems) {
			var i = 0;
			var done = 0;

			while (i < listItems.length && done < this.limit) {
				var item = listItems[i];
				i++;

				if (this.wasVisited(item)) continue;

				if (item.querySelectorAll('span.fr-under-review').length)
					continue;

				var links = item.getElementsByTagName('a');
				if (links.length < 3) continue;

				window.open(links[2].href);
				this.markAsVisited(item);

				done++;
			}
			return done > 0;
		},

		hasUnwatchedPages: function () {
			var listItems = this.getList().querySelectorAll('li.fr-unreviewed-unwatched');
			if (!listItems.length) return false;
			return listItems;
		},
		/**
		 * Special:PendingChanges - Unwatched
		 */
		openUnwatchedPages: function () {
			var listItems = this.getList().querySelectorAll('li.fr-unreviewed-unwatched:not(.visited)');
			if (!listItems.length) {
				alert(this.allDoneInfo);
				return;
			}

			this.openPendingItems(listItems);
		},
		/**
		 * Special:Watchlist
		 */
		openWatchedPages: function () {
			var listItems = document.querySelectorAll('.mw-changeslist-need-review:not(.visited)');
			if (!listItems.length) {
				return false;
			}

			var i = 0;
			var done = 0;
			while (i < listItems.length && done < this.limit) {
				var item = listItems[i];
				i++;

				if (this.wasVisited(item)) continue;

				var link = item.querySelector('.mw-fr-reviewlink a');

				window.open(link.href);
				this.markAsVisited(item);

				done++;
			}
			return done > 0;
		},

		markAsVisited: function (item) {
			item.style.backgroundColor = 'orange';
			item.classList.add('visited');
		},

		wasVisited: function (item) {
			return item.classList.contains('visited');
		},
	};

	//console.log('document.readyState:', document.readyState);
	if (document.readyState === 'loading') {
		document.addEventListener("DOMContentLoaded", function() {
			pendingChangesGadget.init();
		});
	} else {
		pendingChangesGadget.init();
	}

	// wrapper end
};

/**
 * Wait for condition (e.g. for object/function to be defined).
 * 
 * @param {Function} condition Wait until true.
 * @param {Function} callback Function to run after true.
 * @param {Number} interval [optional] Interval for checking the condition.
 */
function waitForCondition(condition, callback, interval) {
	if (condition()) {
		callback();
	} else {
		if (typeof interval !== 'number') {
			interval = 200;
		}
		let intervalId = setInterval(function() {
			//console.log('waiting...');
			if (condition()) {
				//console.log('done');
				clearInterval(intervalId);
				callback();
			}
		}, interval);
	}
}

// wait for mw.loader and then for mw.util
waitForCondition(function(){
	return typeof mw == 'object' && 'loader' in mw && typeof mw.loader.using === 'function';
}, function() {
	mw.loader.using(["mediawiki.util"]).then( function() {
		nuxPendingChangesGadgetWrapper(mw);
	});
});
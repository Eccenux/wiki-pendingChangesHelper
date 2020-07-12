// ==UserScript==
// @name         Wiki Pending Changes Helper
// @namespace    pl.enux.wiki
// @version      0.1.1
// @description  [0.1.1] Pomocnik do przeglądania strona na Wikipedii.
// @author       Nux; Beau; Matma Rex
// @match        https://pl.wikipedia.org/*
// @grant        none
// @updateURL    https://github.com/Eccenux/wiki-pendingChangesHelper/raw/master/pendingChangesHelper.meta.js
// @downloadURL  https://github.com/Eccenux/wiki-pendingChangesHelper/raw/master/pendingChangesHelper.user.js
// ==/UserScript==

window.nuxPendingChangesGadgetWrapper = function (mw, jQuery) {
	// wrapper start

	console.log('pendingChangesGadget');

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
			if (!specialPage) {
				return;
			}
			if (
				specialPage != 'PendingChanges' &&
				specialPage != 'Newpages' &&
				specialPage != 'Contributions'
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
			var list = this.getList();
			if (!list) {
				return;
			}
			var p = document.createElement('p');

			this.createMainButton(p);
			if (this.specialPage == 'PendingChanges') {
				p.appendChild(document.createTextNode(' • '));
				this.createUnwatchedButton(p);
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
				default:
					console.warn('Unsupported page');
					break;
			}
			if (!didSome) {
				alert(this.allDoneInfo);
			}
		},

		/**
		 * Special:Contributions
		 */
		openContributions: function () {
			var listItems = document.querySelectorAll('li.flaggedrevs-pending');
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
				text.replace(/\"stable_revid\":(\d+)/, (a, rev) => {
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

				if (!jQuery(item).hasClass('not-patrolled')) continue;

				var link = jQuery(item).children('a.mw-newpages-pagename');

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

			var i = 0;
			var done = 0;

			while (i < listItems.length && done < this.limit) {
				var item = listItems[i];
				i++;

				if (this.wasVisited(item)) continue;

				if (jQuery(item).children('span.fr-under-review').length)
					continue;

				var links = item.getElementsByTagName('a');
				if (links.length < 3) continue;

				window.open(links[2].href);
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

	jQuery(document).ready(function () {
		pendingChangesGadget.init();
	});

	// wrapper end
};
// inject code into site context
var script = document.createElement('script');
script.appendChild(
	document.createTextNode(`
		// timeout because jQuery is not always ready
		setTimeout(() => {
			nuxPendingChangesGadgetWrapper(mw, jQuery);
		}, 1000);
	`)
);
(document.body || document.head || document.documentElement).appendChild(
	script
);

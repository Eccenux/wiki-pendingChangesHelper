// ==UserScript==
// @name         Wiki Pending Changes Helper
// @namespace    pl.enux.wiki
// @version      0.0.1
// @description  [0.0.1] Pomocnik do przeglądania strona na Wikipedii.
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

			this.createButton();
		},

		/**
		 * Create main action button.
		 */
		createButton: function () {
			var list = this.getList();
			if (!list) {
				return;
			}

			var callback = () => {
				this.openPages();
				return false;
			};

			var caption = this.openCaption.replace('$number', this.limit);

			mw.util.addPortletLink(
				'p-cactions',
				'#',
				caption,
				'portlet-open-ten-pages'
			);
			var portlet = document.getElementById('portlet-open-ten-pages');
			if (portlet) {
				portlet.onclick = callback;
			}

			var a = document.createElement('a');
			a.style.fontWeight = 'bold';
			a.href = '#';
			a.onclick = callback;
			a.appendChild(document.createTextNode(caption));

			var p = document.createElement('p');
			p.appendChild(a);

			list.parentNode.insertBefore(p, list);
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
			var uniques = {};
			[...listItems].some((item) => {
				if (this.wasVisited(item)) {
					return;
				}
				var id = item.querySelector('.mw-contributions-title').href;
				var oid = item.getAttribute('data-mw-revid');
				var diff = item.querySelector('.mw-changeslist-diff').href;
				uniques[id] = diff;
				this.markAsVisited(item);
				if (Object.keys(uniques).length >= this.limit) {
					console.log('limit reached');
					return true;
				}
			});
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

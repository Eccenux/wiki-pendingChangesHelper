﻿/**
 * Main object
 */
// eslint-disable-next-line no-unused-vars
let pendingChangesHelper = {
	/** @readonly */
	version: '{version}',
	/** Configurable by users. */
	options: {
		limit: 5,
		skipNewpages: false,
		skipWatchlist: false,
		skipContributions: false,
		skipRecentchanges: false,

		openCaption: 'Otwórz pierwsze $number stron do przejrzenia',
		openCaption1: 'Otwórz pierwszą stronę do przejrzenia',
		openUnwatchedCaption: 'Pierwsze $number czerwonych (nieobserwowanych)',
		openUnwatchedCaption1: 'Pierwszą czerwoną (nieobserwowaną)',
		openUnreviewedCaption: 'Pierwsze $number nowych artykułów',
		openUnreviewedCaption1: 'Pierwszy nowy artykuł',
		allDoneInfo: 'Koniec 😎',
	},
	/** @private */
	specialPage: '',

	/**
	 * Prepare options from user config.
	 * @param {UserConfig} userConfig 
	 */
	prepareConfig: async function (userConfig) {
		await userConfig.register();

		const userOptions = [
			'limit',
			'skipNewpages',
			'skipWatchlist',
			'skipContributions',
			'skipRecentchanges',
		];
		for (const option of userOptions) {
			let value = userConfig.get(option);
			this.options[option] = value;
		}

		// assuming mobile is not able to open many tabs
		if (this.isMobile()) {
			this.options.limit = 1;
		}
	},

	/** @private is mobile browser. */
	isMobile: function() {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	},

	/**
	 * Main init.
	 * 
	 * @param {UserConfig} userConfig 
	 */
	init: async function (userConfig) {
		await this.prepareConfig(userConfig);

		var specialPage = mw.config.get('wgCanonicalSpecialPageName');
		//console.log('[pendingChangesHelper]', 'init:', specialPage);
		if (!specialPage) {
			return;
		}
		if (
			specialPage != 'PendingChanges' &&
			specialPage != 'Recentchanges' &&
			specialPage != 'Newpages' &&
			specialPage != 'Contributions' &&
			specialPage != 'Watchlist'
		) {
			return;
		}
		if (
			(specialPage == 'Newpages' && this.options.skipNewpages) ||
			(specialPage == 'Contributions' && this.options.skipContributions) ||
			(specialPage == 'Recentchanges' && this.options.skipRecentchanges) ||
			(specialPage == 'Watchlist' && this.options.skipWatchlist)
		) {
			console.log('[pendingChangesHelper]', 'skip specialPage: ', specialPage);
			return;
		}
		this.specialPage = specialPage;

		console.log('[pendingChangesHelper]', 'prepare specialPage: ', specialPage);
		this.createActions();

		// usage: mw.hook('userjs.pendingChangesHelper.afterInit').add(function (pch) {});
		mw.hook('userjs.pendingChangesHelper.afterInit').fire(this);
	},

	/**
	 * Create actions.
	 */
	createActions: function () {
		var postActionEl = this.getActionSibling();
		if (!postActionEl) {
			console.warn('[pendingChangesHelper]', 'list of changes not found');
			return;
		}
		var p = document.createElement('p');

		this.createMainButton(p);

		if (this.specialPage == 'PendingChanges' && this.hasUnwatchedPages()) {
			p.appendChild(document.createTextNode(' • '));
			this.createUnwatchedButton(p);
		} else if (this.specialPage == 'Contributions') {
			if (!this.hasPendingContributions()) {
				p.querySelector('a').style.textDecoration = 'line-through';
			}
			if (this.hasUnreviewedPages()) {
				p.appendChild(document.createTextNode(' • '));
				this.createUnreviewedButton(p);
			}
		}

		postActionEl.insertAdjacentElement("beforebegin", p);
	},
	/**
	 * Create main action button.
	 * @param {Element} container Container to which the button is to be added.
	 */
	createMainButton: function (container) {
		var me = this;
		var callback = function() {
			me.openPages();
			return false;
		};

		var caption = this.options.limit == 1 ? this.options.openCaption1 : this.options.openCaption.replace('$number', this.options.limit);

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
		var me = this;
		var callback = function() {
			me.openUnwatchedPages();
			return false;
		};

		var caption = this.options.limit == 1 ? this.options.openUnwatchedCaption1 : this.options.openUnwatchedCaption.replace('$number', this.options.limit);

		this.createButton(caption, list, callback);
	},

	/**
	 * Create unreviewed items button.
	 * @param {Element} container Container to which the button is to be added.
	 */
	createUnreviewedButton: function (list) {
		var callback = () => {
			this.openUnreviewedPages();
			return false;
		};

		var caption = this.options.limit == 1 ? this.options.openUnreviewedCaption1 : this.options.openUnreviewedCaption.replace('$number', this.options.limit);

		this.createButton(caption, list, callback);
	},

	/**
	 * Selector for typical lists.
	 * @param {String} subSelector Selector for list elelemnts (e.g. `li`).
	 * @returns NodeList
	 */
	getListElements: function (subSelector) {
		return document.querySelectorAll(`#mw-content-text ul ${subSelector}`);
	},

	/**
	 * Get an element before which actions can be inserted.
	 * 
	 * This should be something that contain items (so that actions are inserted before items).
	 * Note that:
	 * <li>there might be multiple `ul` elements per list.
	 * <li>codex version of PCh is `table` based, not `ul` based.
	 * 
	 * @return null when list was not found.
	 */
	getActionSibling: function () {
		if (this.specialPage === 'Watchlist') {
			return document.querySelector('.mw-changeslist');
		}
		else if (this.specialPage === 'PendingChanges') {
			return document.querySelector('.mw-fr-pending-changes-table');
		}
		let parentNode = false;
		// try to get pager body (so that we don't get some other list; which was the case for `mw-logevent-loglines`, for blocked users)
		if (!parentNode) {
			parentNode = document.querySelector('.mw-pager-body');
		}
		// this should work for RC
		if (!parentNode) {
			parentNode = document.querySelector('.mw-changeslist');
		}
		if (!parentNode) {
			parentNode = document.querySelector('#mw-content-text');
		}
		if (parentNode) {
			return parentNode;
		}
		return null;
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
			case 'Recentchanges':
			case 'Watchlist':
				didSome = this.openWatchedPages();
				break;
			default:
				console.warn('[pendingChangesHelper]', 'Unsupported page');
				break;
		}
		if (!didSome) {
			alert(this.options.allDoneInfo);
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
		const {uniques, lastIndex} = this.contributionsFindUnique(listItems);
		this.contributionsMarkUnique(listItems, uniques, lastIndex);

		// open found
		this.openDiffs(uniques);

		return Object.keys(uniques).length > 0;
	},
	/**
	 * Find unique URLs (title.href -> diff.href)
	 * @param {NodeList} listItems list of contributions items.
	 */
	contributionsFindUnique: function (listItems) {
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
			let diff = item.querySelector('.mw-changeslist-diff')?.href;
			// new page, first contribution
			if (!diff) {
				diff = false;
			}
			uniques[id] = diff;

			this.markAsVisited(item);
			if (Object.keys(uniques).length >= this.options.limit) {
				break;
			}
		}
		return {uniques, lastIndex};
	},
	/**
	 * Mark found to the end of the list.
	 */
	contributionsMarkUnique: function (listItems, uniques, lastIndex) {
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
			window.open(url);
		}
	},

	/**
	 * Special:Newpages
	 */
	openNewPages: function () {
		var listItems = this.getListElements('li');
		if (!listItems.length) return;

		var i = 0;
		var done = 0;

		while (i < listItems.length && done < this.options.limit) {
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
		// var listItems = this.getListElements('li');
		var items = document.querySelectorAll('.mw-fr-pending-changes-table tr');
		if (!items.length) return;

		return this.openPendingItems(items);
	},

	/**
	 * Open items from PendingChanges.
	 */
	openPendingItems: function (listItems) {
		var i = 0;
		var done = 0;

		while (i < listItems.length && done < this.options.limit) {
			var item = listItems[i];
			i++;

			if (this.wasVisited(item)) continue;

			if (item.querySelectorAll('span.fr-under-review').length)
				continue;

			let link = item.querySelector('td>a[href*=diff]');
			if (!link) {
				console.warn('[pendingChangesHelper]', 'no link found in row:', item);
				continue;
			}

			window.open(link.href);
			this.markAsVisited(item);

			done++;
		}
		return done > 0;
	},

	hasUnwatchedPages: function () {
		// var listItems = this.getListElements('li.fr-unreviewed-unwatched');
		let items = document.querySelector('.fr-unreviewed-unwatched');
		console.log('hasUnwatchedPages', items);
		if (!items) return false;
		return true;
	},
	/**
	 * Special:PendingChanges - Unwatched
	 */
	openUnwatchedPages: function () {
		var listItems = document.querySelectorAll('.fr-unreviewed-unwatched:not(.visited)');
		if (!listItems.length) {
			alert(this.options.allDoneInfo);
			return;
		}

		this.openPendingItems(listItems);
	},

	hasUnreviewedPages: function () {
		var listItems = this.getListElements('li.flaggedrevs-unreviewed');
		if (!listItems.length) return false;
		return listItems;
	},
	/**
	 * Special:Contributions - Unreviewed
	 */
	openUnreviewedPages: function () {
		var listItems = this.getListElements('li.flaggedrevs-unreviewed:not(.visited)');
		if (!listItems.length) {
			alert(this.options.allDoneInfo);
			return;
		}

		const {uniques, lastIndex} = this.contributionsFindUnique(listItems);
		this.contributionsMarkUnique(listItems, uniques, lastIndex);

		// open found URLs
		for (const url in uniques) {
			if (uniques.hasOwnProperty(url)) {
				window.open(url);
			}
		}
	},

	/**
	 * Special:Watchlist and RC.
	 */
	openWatchedPages: function () {
		var listItems = document.querySelectorAll('.mw-changeslist-need-review:not(.visited)');
		if (!listItems.length) {
			return false;
		}

		var i = 0;
		var done = 0;
		while (i < listItems.length && done < this.options.limit) {
			let item = listItems[i];
			i++;

			if (this.wasVisited(item)) continue;

			let link = item.querySelector('.mw-fr-reviewlink a');
			if (!link) {
				console.warn('[pendingChangesHelper]', 'openWatchedPages: no review link', {item, cls:item.className, txt:item.innerText});
				continue;
			}

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

// ==UserScript==
// @name         Pending Changes Helper
// @namespace    pl.enux.wiki
// @version      0.0.0
// @description  [0.0.0] Pomocnik do przeglądania strona na Wikipedii.
// @author       Nux; Beau; Matma Rex
// @match        https://pl.wikipedia.org/*
// @grant        none
// @updateURL    https://github.com/Eccenux/wiki-pendingChangesHelper/raw/master/pendingChangesHelper.meta.js
// @downloadURL  https://github.com/Eccenux/wiki-pendingChangesHelper/raw/master/pendingChangesHelper.user.js
// ==/UserScript==

window.pendingChangesGadget = {
	version: 4,
	limit: 10,
	openCaption: 'Otwórz pierwsze $number stron do przejrzenia',

	init: function() {
		var that = this;

		if ( mw.config.get( 'wgCanonicalSpecialPageName' ) != "PendingChanges" && mw.config.get( 'wgCanonicalSpecialPageName' ) != "Newpages") {
			return;
		}

		var list = this.getList();
		if ( !list )
			return;

		var callback = function() {
			that.openPages();
			return false;
		};

		var caption = this.openCaption.replace("$number", this.limit);

		mw.util.addPortletLink('p-cactions', '#', caption, 'portlet-open-ten-pages');
		var portlet = document.getElementById('portlet-open-ten-pages');
		if ( portlet ) {
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

	getList: function() {		
		var bodyContent = document.getElementById('mw-content-text');
		if (!bodyContent)
			return null;

		var list = bodyContent.getElementsByTagName('ul');
		if (list.length < 1)
			return null;

		return list[0];
	},

	getListItems: function() {
		var list = this.getList();
		if (!list)
			return [];

		return list.getElementsByTagName('li');
	},

	openPages: function() {
		if ( mw.config.get( 'wgCanonicalSpecialPageName' ) == "PendingChanges" ) {
			this.openPendingChanges();
		}
		else {
			this.openNewPages();
		}
	},

	openNewPages: function() {
		var listItems = this.getListItems();
		if (!listItems.length)
			return;

		var i = 0;
		var done = 0;

		while (i < listItems.length && done < this.limit) {
			var item = listItems[i];
			i++;

			if (this.wasVisited(item))
				continue;

			if (!jQuery(item).hasClass('not-patrolled'))
				continue;

			var link = jQuery(item).children('a.mw-newpages-pagename');

			if (!link.length)
				continue;

			window.open(link[0].href)
			this.markAsVisited(item);

			done++;
		}
	},

	openPendingChanges: function() {
		var listItems = this.getListItems();
		if (!listItems.length)
			return;

		var i = 0;
		var done = 0;

		while (i < listItems.length && done < this.limit) {
			var item = listItems[i];
			i++;

			if (this.wasVisited(item))
				continue;

			if (jQuery(item).children('span.fr-under-review').length)
				continue;

			var links = item.getElementsByTagName('a');
			if(links.length < 3)
				continue;

			window.open(links[2].href);
			this.markAsVisited(item);

			done++;
		}
	},

	markAsVisited: function(item) {
		item.style.backgroundColor = 'orange';
	},

	wasVisited: function(item) {
		return item.style.backgroundColor != '';
	}
};

jQuery(document).ready(function() {
	pendingChangesGadget.init()
});

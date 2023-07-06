	// usage: mw.hook('userjs.pendingChangesHelper.beforeInit').add(function (pch) {});
	mw.hook('userjs.pendingChangesHelper.beforeInit').fire(pendingChangesHelper);

	if (document.readyState === 'loading') {
		document.addEventListener("DOMContentLoaded", function() {
			pendingChangesHelper.init();
		});
	} else {
		pendingChangesHelper.init();
	}

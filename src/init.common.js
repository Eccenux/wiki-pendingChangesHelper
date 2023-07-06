// usage: mw.hook('userjs.pendingChangesHelper.beforeInit').add(function (pch) {});
mw.hook('userjs.pendingChangesHelper.beforeInit').fire(pendingChangesHelper);

// deps
mw.loader.using('ext.gadget.gConfig', function(){ 
	// gConfig
	let userConfig = new UserConfig(gConfig);
	userConfig.register();

	// init on-ready
	if (document.readyState === 'loading') {
		document.addEventListener("DOMContentLoaded", function() {
			pendingChangesHelper.init(userConfig);
		});
	} else {
		pendingChangesHelper.init(userConfig);
	}
});
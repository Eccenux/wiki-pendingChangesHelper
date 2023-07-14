// usage: mw.hook('userjs.pendingChangesHelper.beforeInit').add(function (pch) {});
mw.hook('userjs.pendingChangesHelper.beforeInit').fire(pendingChangesHelper);

// dev mode
var devMode = false;
if (mw.config.get('wgUserName') === 'Nux') {
	devMode = true;
}

// deps
/* global importScript, importStylesheet */
if (devMode || typeof gConfig !== 'object') {
	console.log('[pendingChangesHelper]', 'load: Wikipedysta:Nux/gConfig.js');
	importScript('Wikipedysta:Nux/gConfig.js');
	importStylesheet('Wikipedysta:Nux/gConfig.css');
}

mw.hook('userjs.gConfig.ready').add(function (gConfig) {
	// gConfig
	let userConfig = new UserConfig(gConfig);
	
	// init on-ready
	if (document.readyState === 'loading') {
		document.addEventListener("DOMContentLoaded", function() {
			pendingChangesHelper.init(userConfig);
		});
	} else {
		pendingChangesHelper.init(userConfig);
	}
});
// wait for/load mw.util
mw.loader.using(["mediawiki.util"]).then( function() {
    pendingChangesHelperWrapper(mw);
});
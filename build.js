import fsa from 'fs/promises'

function prepareMeta (monkeyJs) {
	// extract the meta header
	let match = monkeyJs.match(/\/\/\s*==\/UserScript==/);
	if (!match) {
		console.warn('meta not found');
		return "";	// invalid?
	}
	let metaEnd = match.index + match[0].length;
	let meta = monkeyJs.substr(0, metaEnd);
	
	// remove update urls
	meta = meta.replace(/\r\n/g, '\n');
	meta = meta.replace(/\n\/\/ @(updateURL|downloadURL).+/g, '');
	return meta.trim() + '\n';
}

export async function build_js() {
	let srcJs = 'src/pendingChangesHelper.user.js';
	const monkeyJs = await fsa.readFile(srcJs, 'utf8');
	const monkeyMetaJs = prepareMeta(monkeyJs);
	await fsa.writeFile('pendingChangesHelper.user.js', monkeyJs);
	await fsa.writeFile('pendingChangesHelper.meta.js', monkeyMetaJs);
}

/**/
(async () => {
	console.log(new Date().toISOString(), 'start');
	await build_js();
	console.log(new Date().toISOString(), 'done');
})();
/**/

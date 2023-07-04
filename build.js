import fsa from 'fs/promises'

/** Read version from JSON file (like package.json). */
export async function readVersion (config) {
	const data = JSON.parse(await fsa.readFile(config, 'utf8'));
	return data.version;
}

/** Replace version placeholders. */
function applyVersion (js, version) {
	return js.replace(/\{version\}/g, version);
}

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

	// prepare main monkey
	const rawJs = await fsa.readFile(srcJs, 'utf8');
	let version = await readVersion('package.json');
	if (typeof version != 'string') {
		console.error('version not found');
		return false;
	}
	let monkeyJs = applyVersion(rawJs, version);
	await fsa.writeFile('pendingChangesHelper.user.js', monkeyJs);

	// meta
	const monkeyMetaJs = prepareMeta(monkeyJs);
	await fsa.writeFile('pendingChangesHelper.meta.js', monkeyMetaJs);

	return true;
}

/**/
(async () => {
	console.log(new Date().toISOString(), 'start');
	await build_js();
	console.log(new Date().toISOString(), 'done');
})();
/**/

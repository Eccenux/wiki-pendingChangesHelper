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

/** Prepare monkey user script meta. */
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

/** Prepare gadget header. */
function prepareGadget (monkeyJs) {
	// extract the meta header
	let match = monkeyJs.match(/\/\/\s*==\/UserScript==/);
	if (!match) {
		console.warn('meta not found');
		return monkeyJs;	// invalid?
	}
	let metaPreEnd = match.index;
	let metaEnd = match.index + match[0].length;
	let meta = monkeyJs.substr(0, metaPreEnd);
	let content = monkeyJs.substring(metaEnd);
	
	// remove head/foot
	meta = '\n' + meta.trim();
	meta = meta.replace(/\n\/\/ ==\/?UserScript==/g, '');
	// keep only some
	const keep = ['name','description','author','version','homepage','homepageURL','website','source'];
	meta = meta.replace(/\n\/\/ @(\w+).+/g, function(a, key) {
		if (keep.indexOf(key) >= 0) {
			return a;
		}
		return '';
	});
	// merge
	return meta.trim() + '\n\n' + content.trim();
}

/** Prepare all JS files. */
export async function build_js() {
	const buildConf = [
		'contain.header.md',
		'pendingChangesHelper.user.js',
		'init.common.js',
		'contain.footer.md',
	];

	// merge main JS
	let rawJs = '';
	for (let i = 0; i < buildConf.length; i++) {
		const file = buildConf[i];
		let content = await fsa.readFile(`src/${file}`, 'utf8');
		// remove BOM
		if (content.charCodeAt(0) === 0xFEFF) {
			content = content.substring(1);
		}
		rawJs += content + '\n';
	}

	// prepare main monkey
	let version = await readVersion('package.json');
	if (typeof version != 'string') {
		console.error('version not found');
		return false;
	}
	let monkeyJs = applyVersion(rawJs, version);
	const initMonkey = await fsa.readFile('src/init.user.js', 'utf8');
	await fsa.writeFile('pendingChangesHelper.user.js', monkeyJs + '\n\n' + initMonkey);

	// meta
	const monkeyMetaJs = prepareMeta(monkeyJs);
	await fsa.writeFile('pendingChangesHelper.meta.js', monkeyMetaJs);

	// gadget
	const initMw = await fsa.readFile('src/init.mw.js', 'utf8');
	const mwJs = prepareGadget(monkeyJs);
	await fsa.writeFile('pendingChangesHelper.mw.js', mwJs + '\n\n' + initMw);

	return true;
}

/**/
(async () => {
	console.log(new Date().toISOString(), 'start');
	await build_js();
	console.log(new Date().toISOString(), 'done');
})();
/**/

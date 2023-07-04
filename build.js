import less from 'less';
import fs from 'fs';
import fsa from 'fs/promises'

export async function build_js() {
	let srcJs = 'src/pendingChangesHelper.user.js';
	let dstJs = 'pendingChangesHelper.user.js';
	const data = await fsa.readFile(srcJs, 'utf8');
	await fsa.writeFile(dstJs, data);
}

/**/
(async () => {
	console.log(new Date().toISOString(), 'start');
	await build_js();
	console.log(new Date().toISOString(), 'done');
})();
/**/

import less from 'less';
import fs from 'fs';
import fsa from 'fs/promises'

export function build_less() {
	let srcLess = 'src/_main.less';
	let dstCss = 'dist/global.css';
	return new Promise(function(resolve, reject) {
		fs.readFile(srcLess,function(error,data){
			if (!data) {
				console.error('Unable to read Less.', srcLess);
				console.error(error);
				reject('main-less-fail');
				return;
			}
			data = data.toString();
			less.render(data, function (lessError, css) {
				if (lessError) {
					console.error('Unable to parse Less.');
					console.error(lessError);
					reject('parse-less-fail');
					return;
				}
				fs.writeFile(dstCss, css.css, function(saveError){
					if (saveError) {
						console.error('Unable to save css.', dstCss);
						console.error(saveError);
						reject('write-output-css-fail');
						return;
					}
					resolve();
				});
			});
		});
	});
}

export async function build_js() {
	let srcJs = 'src/global.js';
	let dstJs = 'dist/global.js';
	const data = await fsa.readFile(srcJs, 'utf8');
	await fsa.writeFile(dstJs, data);
}

/**
(async () => {
	console.log(new Date().toISOString(), 'start');
	await build_less();
	console.log(new Date().toISOString(), 'done');
})();
/**/

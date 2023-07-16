/**
 * Deploy as a gadget.
 */
import { DeployConfig, WikiployLite } from 'wikiploy';
import { build_js, readVersion } from './build.js';

import * as botpass from './bot.config.mjs';
const ployBot = new WikiployLite(botpass);

(async () => {
	let version = await readVersion('package.json');
	// custom summary
	ployBot.summary = () => {
		return `v${version}: gConfig support`;
	}

	await build_js();

	const configs = [];
	configs.push(new DeployConfig({
		src: 'pendingChangesHelper.mw.js',
		dst: 'MediaWiki:Gadget-pendingChangesHelper.js',
	}));
	await ployBot.deploy(configs);
})().catch(err => {
	console.error(err);
	process.exit(1);
});
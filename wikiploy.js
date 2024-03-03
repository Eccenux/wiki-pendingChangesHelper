/**
 * Deploy as a gadget.
 */
import { DeployConfig, WikiployLite, setupSummary } from 'wikiploy';
import { build_run, readVersion } from './build.js';

import * as botpass from './bot.config.mjs';
const ployBot = new WikiployLite(botpass);

(async () => {
	await build_run();

	// custom summary from a prompt
	let version = await readVersion('package.json');
	await setupSummary(ployBot, version);

	const configs = [];
	// dev
	configs.push(new DeployConfig({
		src: 'pendingChangesHelper.mw.js',
	}));
	// release
	configs.push(new DeployConfig({
		src: 'pendingChangesHelper.mw.js',
		dst: 'MediaWiki:Gadget-pendingChangesHelper.js',
	}));
	await ployBot.deploy(configs);
})().catch(err => {
	console.error(err);
	process.exit(1);
});
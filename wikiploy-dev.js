/**
 * Dev/staging deploy.
 */
import { DeployConfig, WikiployLite } from 'wikiploy';
import { build_run, readVersion } from './build.js';

import * as botpass from './bot.config.mjs';
const ployBot = new WikiployLite(botpass);

(async () => {
	let version = await readVersion('package.json');
	// custom summary
	ployBot.summary = () => {
		return `v${version}: changes from Github`;
	}

	await build_run();

	const configs = [];
	configs.push(new DeployConfig({
		src: 'pendingChangesHelper.mw.js',
	}));
	await ployBot.deploy(configs);
})().catch(err => {
	console.error(err);
	process.exit(1);
});
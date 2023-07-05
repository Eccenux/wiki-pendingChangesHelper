/**
 * Dev/staging deploy.
 */
import { DeployConfig, Wikiploy } from 'wikiploy';
import { build_js, readVersion } from './build.js';

const ployBot = new Wikiploy();

(async () => {
	let version = await readVersion('package.json');
	// custom summary
	ployBot.summary = () => {
		return `v${version}: Recentchanges support`;
	}

	await build_js();

	const configs = [];
	configs.push(new DeployConfig({
		src: 'pendingChangesHelper.user.js',
	}));
	await ployBot.deploy(configs);
})().catch(err => {
	console.error(err);
	process.exit(1);
});
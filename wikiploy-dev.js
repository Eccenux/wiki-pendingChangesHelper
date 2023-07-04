/**
 * Dev/staging deploy.
 */
import { DeployConfig, Wikiploy } from 'wikiploy';
import { build_js, readVersion } from './build';

const ployBot = new Wikiploy();

(async () => {
	let version = await readVersion();
	// custom summary
	ployBot.summary = () => {
		return `v${version}: JS builder`;
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
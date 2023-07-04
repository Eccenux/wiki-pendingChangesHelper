/**
 * Dev/staging deploy.
 */
import {DeployConfig, Wikiploy} from 'wikiploy';

const ployBot = new Wikiploy();

// custom summary
ployBot.summary = () => {
	return 'v5.2.0: wikiploy test';
}

(async () => {
	const configs = [];
	configs.push(new DeployConfig({
		src: 'pendingChangesHelper.user.js',
	}));
	await ployBot.deploy(configs);
})().catch(err => {
	console.error(err);
	process.exit(1);
});
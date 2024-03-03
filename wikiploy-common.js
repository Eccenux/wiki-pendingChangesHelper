import { userPrompt } from 'wikiploy';

/**
 * Read and setup summary.
 * @param {WikiployLite} ployBot Bot.
 * @param {Number} version Gadget version.
 */
export async function setupSummary(ployBot, version = '') {
	let info = version.length ? `(empty for a standard summary prefixed with v${version})` : `(empty for a standard summary)`;
	let summary = await userPrompt(`Summary of changes ${info}:`);
	if (typeof summary !== 'string' || !summary.length) {
		summary = 'changes from Github';
	}
	ployBot.summary = () => {
		return version.length ? `v${version}: ${summary}` : summary;
	};
	console.log(`[INFO] summary: »${ployBot.summary()}«\n`);
}
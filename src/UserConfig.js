/**
 * Helper class for gConfig.
 */
// eslint-disable-next-line no-unused-vars
class UserConfig {
	constructor(gConfig) {
		this.gConfig = gConfig;
		/** gConfig key/tag. */
		this.configKey = 'PendingChangesHelper';
		/** Base info. */
		this.gadgetInfo = {
			name: 'Pending Changes Helper',
			descriptionPage: 'Wikipedia:Narzędzia/Pending Changes Helper' 
		};
		/** Special pages that have a skip option. */
		this.skipPages = [
			'Newpages',
			'Watchlist',
			'Contributions',
			'Recentchanges',
		];
	}

	/** Get user option. */
	get(option) {
		this.gConfig.get(this.configKey, option);
	}

	/** @private Load i18n for mw.msg. */
	loadI18n() {
		return new Promise((resolve, reject) => {
			new mw.Api().loadMessagesIfMissing( this.skipPages )
				.done( function( data ) {
					resolve( data );
				} )
				.fail( function( err ) {
					console.warn('[pendingChangesHelper]', 'i18n error?', err);
					reject(err);
				} )
			;
		});
	}

	/** Register messages. */
	async register() {
		await this.loadI18n();

		// https://pl.wikipedia.org/wiki/MediaWiki:Gadget-gConfig.js#L-147
		let options = [];
		options.push({
			name: 'limit',
			desc: 'Liczba otwieranych stron.',
			type: 'integer',
			deflt: 5,
		});

		let skips = this.skipPages;
		for (const page of skips) {
			// console.log(page);
			options.push({
				name: `skip${page}`,
				desc: `Pomiń stronę: ${mw.msg(page)}.`,
				type: 'boolean',
				deflt: false,
			});
		}

		// https://pl.wikipedia.org/wiki/MediaWiki:Gadget-gConfig.js#L-147
		this.gConfig.register(this.configKey, this.gadgetInfo, options);
	}
}

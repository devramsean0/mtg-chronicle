import { Store } from '@sapphire/pieces';
import { Integration } from './integration.js'
import { IntegrationLoaderStrategy } from './integrationLoaderStrategy.js';

export class IntegrationStore extends Store<Integration, 'integrations'> {
	public constructor() {
		super(Integration, { name: 'integrations', strategy: new IntegrationLoaderStrategy() });
	}
}
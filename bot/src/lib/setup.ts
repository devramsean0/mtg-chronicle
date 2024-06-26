// Unless explicitly defined, set NODE_ENV as development:
process.env.NODE_ENV ??= 'development';
process.env.DEBUG_LOGGING ??= 'false';

import { ApplicationCommandRegistries, RegisterBehavior } from '@sapphire/framework';
import '@sapphire/plugin-logger/register';
import '@sapphire/plugin-hmr/register';
import '@sapphire/plugin-api/register';
import { setup } from '@skyra/env-utilities';
import * as colorette from 'colorette';
import { join } from 'node:path';
import { rootDir } from './constants.js';

// Read env var
setup({ path: join(rootDir, '.env') });

// Set default behavior to bulk overwrite
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);

// Enable colorette
colorette.createColors({ useColor: true });

import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { styleText } from '../lib/utils.js';
import { downloadMediaMessage } from 'baileys';
import pino from "pino";

const plugin: Plugin = {
    commands: ["vision", "analyze", "whatisthis", "describe"],

    async execute(ctx: PluginContext): Promise<void> {
        // TODO: Migrate execute body manually
        await ctx.reply("Plugin needs manual migration");
    }
};

export default plugin;

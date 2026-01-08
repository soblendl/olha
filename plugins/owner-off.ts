import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { isOwner, styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['off', 'apagar', 'shutdown'],

    async execute(ctx: PluginContext): Promise<void> {

        if (!isOwner(ctx.ctx.sender, global.botOwner)) {
        await ctx.ctx.reply(styleText('✘ Solo el owner puede usar este comando.'));
        }

        await ctx.ctx.reply(styleText('🔴 *Apagando bot...*\n\n> Hasta pronto~'));

        setTimeout(() => {
        console.log('🔴 Bot apagado por comando del owner');
        process.exit(0);
        }, 1500);
    }
};

export default plugin;

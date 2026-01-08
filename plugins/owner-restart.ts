import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { isOwner, styleText } from '../lib/utils.js';
import { spawn } from 'child_process';

const plugin: Plugin = {
    commands: ['restart', 'reiniciar', 'reboot'],

    async execute(ctx: PluginContext): Promise<void> {

        if (!isOwner(ctx.ctx.sender, global.botOwner)) {
        await ctx.ctx.reply(styleText('✘ Solo el owner puede usar este comando.'));
        }

        await ctx.ctx.reply(styleText('🔄 *Reiniciando bot...*\n\n> Volveré en unos segundos~'));

        setTimeout(() => {
        console.log('🔄 Bot reiniciando por comando del owner');

        const args = process.argv.slice(1);
        const child = spawn(process.argv[0], ctx.args, {
        detached: true,
        stdio: 'inherit',
        cwd: process.cwd()
        });

        child.unref();
        process.exit(0);
        }, 1500);
    }
};

export default plugin;

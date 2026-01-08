import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['ai', 'ia'],
    
    async execute(ctx: PluginContext): Promise<void> {
        if (ctx.args.length === 0) {
            await ctx.reply('ꕤ Debes escribir una pregunta.\nUso: #ai <pregunta>');
            return;
        }

        const question = ctx.args.join(' ');

        await ctx.reply(
            `ꕥ *AI Assistant*\n\n` +
            `Pregunta: ${question}\n\n` +
            `Esta funcionalidad requiere integración con una API de IA (como Gemini, GPT, etc.).\n` +
            `Por ahora está en modo de demostración.`
        );
    }
};

export default plugin;

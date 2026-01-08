import type { Plugin, PluginContext } from '../src/types/plugin.js';
const OWNERS = ['5731154341766', '526631079388', '595983799436'];


const plugin: Plugin = {
    commands: ['staff'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const senderNumber = ctx.from.id.split('@')[0];
        
        if (!OWNERS.includes(senderNumber)) {
            await ctx.reply('ꕤ Solo los owners del bot pueden usar este comando.');
            return;
        }

        await ctx.reply(
            `ꕥ *Llamado de Staff*\n\n` +
            `El owner ha solicitado una reunión del staff.\n` +
            `Todos los administradores deben estar atentos.`
        );
    }
};

export default plugin;

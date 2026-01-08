import type { Plugin, PluginContext } from '../src/types/plugin.js';


const plugin: Plugin = {
    commands: ['economy'],
    
    async execute(ctx: PluginContext): Promise<void> {
        if (!ctx.isGroup) {
            await ctx.reply('ꕤ Este comando solo funciona en grupos.');
            return;
        }

        if (!ctx.isGroupAdmin) {
            await ctx.reply('ꕤ Solo los administradores pueden usar este comando.');
            return;
        }

        if (!ctx.args[0] || !['on', 'off'].includes(ctx.args[0].toLowerCase())) {
            await ctx.reply('ꕤ Uso: #economy <on/off>');
            return;
        }

        const enable = ctx.args[0].toLowerCase() === 'on';
        const groupData = ctx.dbService.getGroup(ctx.chatId);
        groupData.settings.economy = enable;
        ctx.dbService.markDirty();

        await ctx.reply(`ꕥ Sistema de economía ${enable ? 'activado' : 'desactivado'}.`);
    }
};

export default plugin;

import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['love', 'amor', 'ship'],

    async execute(ctx: PluginContext): Promise<void> {

        const { msg, bot, text } = ctx
        const mentionedJid = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
        const sender = ctx.ctx.sender

        let target = ''
        if (mentionedJid && mentionedJid.length > 0) {
        target = mentionedJid[0]
        } else if (text) {
        // Handle text name? For now just require mention
        await ctx.ctx.reply(styleText('ꕤ Etiqueta a alguien para calcular el amor.'))
        } else {
        await ctx.ctx.reply(styleText('ꕤ Etiqueta a alguien para calcular el amor.'))
        }

        const percentage = Math.floor(Math.random() * 101)
        let message = ''

        if (percentage < 25) {
        message = '💔 No hay futuro aquí...'
        } else if (percentage < 50) {
        message = '😐 Podría funcionar con esfuerzo.'
        } else if (percentage < 75) {
        message = '❤️ Hay buena química.'
        } else {
        message = '💖 ¡Son almas gemelas!'
        }

        const response = `*Calculadora de Amor* 💘\n\n` +
        `🔻 *${ctx.sender.split('@')[0]}* + *${target.split('@')[0]}*\n` +
        `📊 *Porcentaje:* ${percentage}%\n` +
        `📝 *Resultado:* ${message}`

        await ctx.ctx.reply(styleText(response), { mentions: [ctx.sender, target] })
    }
};

export default plugin;

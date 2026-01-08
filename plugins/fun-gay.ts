import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['gay', 'howgay'],

    async execute(ctx: PluginContext): Promise<void> {

        const { msg, sender, from, text } = ctx;
        const mentioned = (msg as Error).message?.extendedTextMessage?.contextInfo?.mentionedJid;

        let target = sender;

        if (mentioned && mentioned.length > 0) {
        target = mentioned[0];
        }

        const percentage = Math.floor(Math.random() * 101);
        let description = '';
        if (percentage < 25) description = 'Heteropatriarcal 🗿';
        else if (percentage < 50) description = 'Curioso... 🤨';
        else if (percentage < 75) description = 'Bastante gei 🏳️‍🌈';
        else description = 'REINA DEL DRAMA 💅✨';

        // Si se proporcionó texto pero no mención, usamos el texto como nombre
        const isMention = mentioned && mentioned.length > 0;
        const displayName = (text && !isMention) ? text : `@${target.split('@')[0]}`;

        const response = `❐ *Calculadora Gay* \n\n` +
        `➯ *Usuario:* ${displayName}\n` +
        `◷ *Porcentaje:* ${percentage}%\n` +
        `✐ *Diagnóstico:* ${description}`;

        await ctx.reply(styleText(response), { mentions: [target] });
    }
};

export default plugin;

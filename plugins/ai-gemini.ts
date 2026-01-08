import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['gemini'],

    async execute(ctx: PluginContext): Promise<void> {

        const { text, prefix, command, bot, chatId, msg, reply } = ctx;
        const conn = bot.sock;
        
        if (!text || text.trim().length === 0) {
            await reply(styleText(`💬 Ejemplo:\n${prefix + command} ¿qué es un agujero negro?`));
            return;
        }

        if ((ctx as any).react) {
            await (ctx as any).react("⏳");
        }

        try {
            const apiURL = `https://api.zenzxz.my.id/api/ai/gemini?text=${encodeURIComponent(text)}&id=id`;
            const res = await fetch(apiURL);
            
            if (!res.ok) throw new Error(`API respondió con estado ${res.status}`);
            
            const json = await res.json();
            const geminiReply = json?.data?.response;
            
            if (!geminiReply) throw new Error("Gemini devolvió un resultado vacío");
            
            await conn.sendMessage(chatId, { text: styleText(geminiReply) }, { quoted: msg });
        } catch (error: unknown) {
            console.error("❌ Error en /gemini:", (error as Error).message);
            await reply(styleText("❌ Hubo un problema al consultar Gemini AI."));
        }

        if ((ctx as any).react) {
            await (ctx as any).react("✅");
        }
    }
};

export default plugin;
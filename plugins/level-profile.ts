import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['level', 'lvl', 'rank', 'xp'],

    async execute(ctx: PluginContext): Promise<void> {

        const { levelService } = ctx;
        const rank = levelService.getRank(ctx.ctx.sender);
        const barLength = 20;
        const filled = Math.floor((rank.progress / 100) * barLength);
        const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
        const text = `╭─────── ୨୧ ───────╮
        │ *Rango de usuario*
        ╰─────────────────╯
        ✿ *::* *Usuario* › ${ctx.from.name}
        ✿ *::* *Nivel*   › ${rank.level}
        ✿ *::* *XP*      › ${rank.xp} / ${rank.required}

        ╭─── ⚐ Progreso ───╮
        │ [${bar}] ${rank.progress}%
        ╰─────────────────╯`;
        await ctx.ctx.reply(styleText(text));
    }
};

export default plugin;

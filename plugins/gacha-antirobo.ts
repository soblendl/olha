import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['antirobo', 'proteger'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const args = ctx.ctx.args;
        const userData = ctx.userData;

        if (!ctx.args[0] || !['hora', 'dia', 'semana', 'mes'].includes(ctx.args[0].toLowerCase())) {
            await ctx.ctx.reply(
                `✘ Uso incorrecto.\nFormato correcto:\n\n` +
                `*#antirobo hora*  (30,000 monedas - 1 hora)\n` +
                `*#antirobo dia*   (500,000 monedas - 1 día)\n` +
                `*#antirobo semana* (2,000,000 monedas - 1 semana)\n` +
                `*#antirobo mes*   (5,000,000 monedas - 1 mes)`
            );
        }

        const tipo = ctx.args[0].toLowerCase();
        let costo = 0;
        let duracion = 0;

        switch (tipo) {
            case 'hora':
                costo = 30000;
                duracion = 60 * 60 * 1000;
                break;
            case 'dia':
                costo = 500000;
                duracion = 24 * 60 * 60 * 1000;
                break;
            case 'semana':
                costo = 2000000;
                duracion = 7 * 24 * 60 * 60 * 1000;
                break;
            case 'mes':
                costo = 5000000;
                duracion = 30 * 24 * 60 * 60 * 1000;
                break;
        }

        if ((userData.monedas || 0) < costo) {
            await ctx.ctx.reply(
                `✘ No tienes suficientes monedas.\n` +
                `Necesitas *${costo.toLocaleString()}* monedas para activar el AntiRobo por ${tipo}.`
            );
        }

        userData.monedas = (userData.monedas || 0) - costo;
        userData.antirobo = Date.now() + duracion;
        ctx.dbService.markDirty();

        await ctx.ctx.reply(
            `✅ *AntiRobo activado* por *${tipo}*.\n` +
            `🛡 Tus waifus estarán protegidas hasta:\n` +
            `*${new Date(userData.antirobo).toLocaleString()}*`
        );
    }
};

export default plugin;

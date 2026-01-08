export const PREFIXES: string[] = ['/', '!', '#', '.', ':', "?:"];
export const DEFAULT_PREFIX: string = '#';
export const OWNER_JID: string = '573115434166@s.whatsapp.net';
export interface CacheTTL {
    DEFAULT: number;
    USER_DATA: number;
    GROUP_METADATA: number;
    MEDIA: number;
}
export const CACHE_TTL: CacheTTL = {
    DEFAULT: 300,
    USER_DATA: 120,
    GROUP_METADATA: 600,
    MEDIA: 3600
};
export interface RateLimitConfig {
    COMMAND_COOLDOWN: number;
    SPAM_THRESHOLD: number;
    SPAM_WINDOW: number;
    SPAM_TIMEOUT: number;
}
export const RATE_LIMIT: RateLimitConfig = {
    COMMAND_COOLDOWN: 1000,
    SPAM_THRESHOLD: 5,
    SPAM_WINDOW: 10000,
    SPAM_TIMEOUT: 30000
};
export interface TimeoutsConfig {
    STREAM: number;
    API_REQUEST: number;
    DB_SAVE: number;
}
export const TIMEOUTS: TimeoutsConfig = {
    STREAM: 30000,
    API_REQUEST: 15000,
    DB_SAVE: 10000
};
export const AUTO_SAVE_INTERVAL: number = 10000;
export interface StreamConfig {
    MAX_SIZE: number;
    RETRY_ATTEMPTS: number;
    RETRY_DELAY: number;
}
export const STREAM: StreamConfig = {
    MAX_SIZE: 50 * 1024 * 1024,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
};
export interface ErrorMessages {
    COMMAND_NOT_FOUND: string;
    RATE_LIMITED: string;
    SPAM_DETECTED: string;
    GENERIC_ERROR: string;
    DB_ERROR: string;
    PERMISSION_DENIED: string;
}
export const ERRORS: ErrorMessages = {
    COMMAND_NOT_FOUND: 'ꕤ Comando no encontrado.',
    RATE_LIMITED: 'ꕤ Estás enviando comandos muy rápido. Espera un momento.',
    SPAM_DETECTED: 'ꕤ Has sido silenciado por spam. Espera 30 segundos.',
    GENERIC_ERROR: 'ꕤ Ocurrió un error al ejecutar el comando.',
    DB_ERROR: 'ꕤ Error de base de datos. Inténtalo de nuevo.',
    PERMISSION_DENIED: 'ꕤ No tienes permiso para usar este comando.'
};
export interface SuccessMessages {
    COMMAND_EXECUTED: string;
}
export const SUCCESS: SuccessMessages = {
    COMMAND_EXECUTED: '✅ Comando ejecutado correctamente.'
};
export default {
    PREFIXES,
    DEFAULT_PREFIX,
    OWNER_JID,
    CACHE_TTL,
    RATE_LIMIT,
    TIMEOUTS,
    AUTO_SAVE_INTERVAL,
    STREAM,
    ERRORS,
    SUCCESS
};
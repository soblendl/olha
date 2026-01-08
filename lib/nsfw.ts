import axios from 'axios';

interface NsfwLink {
    url: string;
    category: string;
}

const nsfwDatabase: Record<string, string[]> = {
    hentai: [],
    porn: [],
    bikini: []
};

export async function loadLinks(category: string): Promise<string[]> {
    // Si ya están cargados, retornarlos
    if (nsfwDatabase[category] && nsfwDatabase[category].length > 0) {
        return nsfwDatabase[category];
    }

    // URLs de APIs públicas de ejemplo (reemplaza con tus propias fuentes)
    const apiUrls: Record<string, string> = {
        hentai: 'https://api.waifu.pics/nsfw/waifu',
        porn: 'https://api.waifu.pics/nsfw/waifu',
        bikini: 'https://api.waifu.pics/sfw/waifu'
    };

    try {
        const response = await axios.get(apiUrls[category] || apiUrls.hentai);
        const url = response.data.url;
        
        if (url) {
            nsfwDatabase[category] = [url];
            return [url];
        }
    } catch (error: unknown) {
        console.error(`Error loading ${category} links:`, error);
    }

    return [];
}

export function getRandomLink(links: string[]): string {
    return links[Math.floor(Math.random() * links.length)];
}

export async function downloadMedia(url: string): Promise<Buffer | null> {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error: unknown) {
        console.error('Error downloading media:', error);
        return null;
    }
}
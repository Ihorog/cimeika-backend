/**
 * Application constants
 */
export const DEFAULT_TIMEOUT = 30000; // 30s Cloudflare limit
export const MAX_RETRIES = 3;
export const RATE_LIMIT_PER_MINUTE = 100;
export const KV_CACHE_TTL = 300; // 5 minutes
export const MAX_MESSAGE_SIZE = 1048576; // 1MB
export const HEALTH_CHECK_INTERVAL = 60000; // 1 minute

/**
 * Cimeika Resources
 */
export const CIMEIKA_RESOURCES = {
  WEBSITES: {
    MAIN: 'https://cimeika.com.ua',
    WWW: 'https://www.cimeika.com.ua',
  },
  GITHUB: {
    ORGANIZATION: 'https://github.com/Ihorog',
    REPOS: {
      CIT: 'https://github.com/Ihorog/cit',
      CIWIKI: 'https://github.com/Ihorog/ciwiki',
      UNIFIED: 'https://github.com/Ihorog/cimeika-unified',
      ALISA_PWA: 'https://github.com/Ihorog/alisa-pwa-4',
      MEDIA: 'https://github.com/Ihorog/media',
      CITT: 'https://github.com/Ihorog/citt',
      CIT_VERCEL: 'https://github.com/Ihorog/cit_versel',
      APP: 'https://github.com/Ihorog/cimeika-app',
    },
  },
  HUGGINGFACE: {
    ORGANIZATION: 'https://huggingface.co/Ihorog',
    API: 'https://huggingface.co/spaces/Ihorog/cimeika-api',
  },
  CONTACT: {
    GOOGLE: 'iglu963@gmail.com',
    CIMEIKA: 'cimeika.com.ua@gmail.com',
  },
};

/**
 * CORS allowed origins
 */
export const CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://cimeika.com.ua',
  'https://www.cimeika.com.ua',
];

/**
 * Agent types mapping
 */
export const AGENT_TYPES = {
  CI: 'ci',
  PODIYA: 'podiya',
  NASTRIY: 'nastriy',
  MALYA: 'malya',
  KAZKAR: 'kazkar',
  KALENDAR: 'kalendar',
  GALLERY: 'gallery',
};

/**
 * API response messages (Ukrainian)
 */
export const MESSAGES = {
  SUCCESS: 'Успішно виконано',
  ERROR_GENERIC: 'Сталася помилка',
  ERROR_NOT_FOUND: 'Не знайдено',
  ERROR_UNAUTHORIZED: 'Не авторизовано',
  ERROR_RATE_LIMIT: 'Перевищено лі��іт запитів',
  ERROR_INVALID_INPUT: 'Невірні вхідні дані',
  HEALTH_OK: 'Система працює нормально',
  HEALTH_DEGRADED: 'Система працює зі збоями',
  HEALTH_DOWN: 'Система недоступна',
};

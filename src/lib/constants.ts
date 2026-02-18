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

/**
 * Error codes for API responses
 */
export const ERROR_CODES = {
  // General errors (1000-1999)
  GENERIC_ERROR: 'ERR_1000',
  NOT_FOUND: 'ERR_1001',
  INVALID_REQUEST: 'ERR_1002',

  // Authentication errors (2000-2999)
  UNAUTHORIZED: 'ERR_2000',
  INVALID_TOKEN: 'ERR_2001',
  TOKEN_EXPIRED: 'ERR_2002',
  FORBIDDEN: 'ERR_2003',

  // Rate limiting errors (3000-3999)
  RATE_LIMIT_EXCEEDED: 'ERR_3000',
  TOO_MANY_REQUESTS: 'ERR_3001',

  // Validation errors (4000-4999)
  VALIDATION_ERROR: 'ERR_4000',
  INVALID_JSON: 'ERR_4001',
  MISSING_FIELD: 'ERR_4002',
  INVALID_TYPE: 'ERR_4003',
  OUT_OF_RANGE: 'ERR_4004',

  // Agent errors (5000-5999)
  AGENT_NOT_FOUND: 'ERR_5000',
  AGENT_UNAVAILABLE: 'ERR_5001',
  AGENT_TIMEOUT: 'ERR_5002',

  // Database errors (6000-6999)
  DATABASE_ERROR: 'ERR_6000',
  QUERY_FAILED: 'ERR_6001',
  CONNECTION_FAILED: 'ERR_6002',

  // Storage errors (7000-7999)
  STORAGE_ERROR: 'ERR_7000',
  FILE_NOT_FOUND: 'ERR_7001',
  FILE_TOO_LARGE: 'ERR_7002',
  UPLOAD_FAILED: 'ERR_7003',
};

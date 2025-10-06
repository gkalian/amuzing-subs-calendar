// Global variables from vite.config.ts
declare const __STORAGE_MODE__: 'local' | 'api';
declare const __API_URL__: string;

export const STORAGE_MODE = __STORAGE_MODE__;
export const API_URL = __API_URL__;

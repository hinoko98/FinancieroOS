import axios from 'axios';

function normalizeApiBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiBaseUrl =
  configuredApiUrl && configuredApiUrl.length > 0
    ? normalizeApiBaseUrl(configuredApiUrl)
    : '/api/v1';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

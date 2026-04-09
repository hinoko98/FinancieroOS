import axios from 'axios';

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const apiBaseUrl =
  configuredApiUrl && /^https?:\/\//i.test(configuredApiUrl)
    ? configuredApiUrl
    : 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

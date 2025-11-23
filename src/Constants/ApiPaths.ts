import { environment } from '../environments/environment';

export const BASE_API = environment.baseApiUrl;

export const API_PATHS = {
  STACK: `${BASE_API}/stack`,
  LEZIONI: `${BASE_API}/lezioni`,
  ADMIN: `${BASE_API}/admin`,
};


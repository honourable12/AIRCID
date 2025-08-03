// Environment configuration utility
// Works in both Vite and Jest environments

const getViteEnv = () => {
  try {
    // Use eval to avoid Jest parsing import.meta at compile time
    return eval('typeof import !== "undefined" && import.meta && import.meta.env');
  } catch {
    return false;
  }
};

const getApiBaseUrl = (): string => {
  // In Jest/test environment, use process.env
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return process.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  }
  
  // In Vite environment, try to use import.meta.env
  const viteEnv = getViteEnv();
  if (viteEnv) {
    return viteEnv.VITE_API_BASE_URL || 'http://localhost:3001/api';
  }
  
  // Fallback
  return 'http://localhost:3001/api';
};

const getNodeEnv = (): string => {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  
  const viteEnv = getViteEnv();
  if (viteEnv) {
    return viteEnv.NODE_ENV || 'development';
  }
  
  return 'development';
};

export const env = {
  API_BASE_URL: getApiBaseUrl(),
  NODE_ENV: getNodeEnv(),
  IS_DEV: getNodeEnv() === 'development',
  IS_PROD: getNodeEnv() === 'production',
  IS_TEST: getNodeEnv() === 'test',
};

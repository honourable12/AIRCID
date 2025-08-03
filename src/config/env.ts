// Environment configuration that works with both Vite and Jest
export const env = {
  API_BASE_URL: import.meta.env?.VITE_API_BASE_URL || 
                process.env.VITE_API_BASE_URL || 
                'http://localhost:3001/api'
};

// Dummy token utilities for authentication
export const generateDummyToken = (username: string): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: username,
    name: username,
    role: 'researcher',
    iat: Date.now() / 1000,
    exp: (Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }));
  const signature = btoa(`dummy-signature-${username}-${Date.now()}`);
  
  return `${header}.${payload}.${signature}`;
};

export const validateToken = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp > (Date.now() / 1000);
  } catch {
    return false;
  }
};

export const getUserFromToken = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      username: payload.sub,
      name: payload.name,
      role: payload.role
    };
  } catch {
    return null;
  }
};
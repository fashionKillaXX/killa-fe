// OAuth and authentication service for backend integration

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  accessToken: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
}

// Get Google OAuth authorization URL from backend
export async function getGoogleAuthUrl(): Promise<string> {
  try {
    console.log('Fetching Google auth URL from:', `${BACKEND_URL}/fashion/auth/google/authorize/`);
    const response = await fetch(`${BACKEND_URL}/fashion/auth/google/authorize/`);
    console.log('Auth URL response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Auth URL error response:', errorText);
      throw new Error(`Failed to get auth URL: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Auth URL response data:', data);
    return data.authorization_url; // Backend returns authorization_url field
  } catch (error) {
    console.error('Error getting Google auth URL:', error);
    throw error;
  }
}

// Exchange authorization code for access token via backend
export async function exchangeCodeForToken(code: string): Promise<AuthTokens> {
  try {
    console.log('Exchanging code for token at:', `${BACKEND_URL}/fashion/auth/google/callback/`);
    console.log('Sending code:', code.substring(0, 20) + '...');
    
    const response = await fetch(`${BACKEND_URL}/fashion/auth/google/callback/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    console.log('Token exchange response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange error response:', errorText);
      throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Token exchange success:', { hasAccessToken: !!data.access_token, user: data.user });
    return data;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
}

// Store authentication tokens in localStorage
export function storeAuthTokens(tokens: AuthTokens): void {
  localStorage.setItem('access_token', tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }
  localStorage.setItem('user', JSON.stringify(tokens.user));
}

// Get stored authentication token
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

// Get stored user data
export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  
  const token = getStoredToken();
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    return {
      ...user,
      accessToken: token,
    };
  } catch {
    return null;
  }
}

// Clear stored authentication data
export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

// Get user profile from backend
export async function getUserProfile(): Promise<any> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('No access token available');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/fashion/api/user/profile/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

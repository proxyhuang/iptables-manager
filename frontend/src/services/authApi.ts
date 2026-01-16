import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/api/v1'
  : 'http://localhost:8080/api/v1';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/auth/login`,
      credentials
    );
    return response.data;
  },
};

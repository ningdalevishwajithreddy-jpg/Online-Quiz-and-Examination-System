import api from './httpClient';

/**
 * Auth endpoints. The client never sees or stores a token: the API sets an
 * httpOnly cookie and this module just reports the resulting session state.
 */
export const authApi = {
  async register({ name, email, password }) {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data.data.user;
  },

  async login({ email, password }) {
    const { data } = await api.post('/auth/login', { email, password });
    return data.data.user;
  },

  async logout() {
    const { data } = await api.post('/auth/logout');
    return data;
  },

  /** Returns null when there is no valid session (instead of throwing). */
  async getCurrentUser() {
    try {
      const { data } = await api.get('/auth/me');
      return { user: data.data.user, roleLabel: data.data.roleLabel };
    } catch (error) {
      if (error?.status === 401) return null;
      throw error;
    }
  },

  async updateProfile({ name }) {
    const { data } = await api.patch('/auth/profile', { name });
    return data.data.user;
  },

  async changePassword({ currentPassword, newPassword }) {
    const { data } = await api.patch('/auth/password', { currentPassword, newPassword });
    return data;
  },
};

export default authApi;

import api from './httpClient';

/**
 * Platform health. The API answers 503 with a `degraded` payload when MongoDB
 * is unreachable, so a 503 is treated as data rather than a transport error.
 */
export const healthApi = {
  async getHealth() {
    const response = await api.get('/health', {
      // 503 carries a useful `degraded` payload - accept it as data.
      validateStatus: (status) => status === 200 || status === 503,
    });

    if (!response.data?.data) return null;
    return { ...response.data.data, healthy: response.status === 200 };
  },
};

export default healthApi;

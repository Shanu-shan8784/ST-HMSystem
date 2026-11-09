import axiosInstance from './axiosInstance';

export const authService = {
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  },

  refreshToken: async () => {
    const response = await axiosInstance.post('/auth/refresh');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await axiosInstance.post('/auth/create-user', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },

  getAllUsers: async () => {
    const response = await axiosInstance.get('/auth/users');
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await axiosInstance.delete(`/auth/users/${id}`);
    return response.data;
  },

  getPendingStudents: async () => {
    const response = await axiosInstance.get('/auth/pending-students');
    return response.data;
  },

  approveStudent: async (id, status, rejectionReason = '') => {
    const response = await axiosInstance.patch(`/auth/approve-student/${id}`, {
      status,
      rejectionReason,
    });
    return response.data;
  },
};

export default authService;

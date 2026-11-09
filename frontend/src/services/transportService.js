import axiosInstance from './axiosInstance';

export const transportService = {
  // Routes
  getRoutes: async () => {
    const response = await axiosInstance.get('/transport/routes');
    return response.data;
  },

  createRoute: async (routeData) => {
    const response = await axiosInstance.post('/transport/routes', routeData);
    return response.data;
  },

  updateRoute: async (id, routeData) => {
    const response = await axiosInstance.put(`/transport/routes/${id}`, routeData);
    return response.data;
  },

  deleteRoute: async (id) => {
    const response = await axiosInstance.delete(`/transport/routes/${id}`);
    return response.data;
  },

  assignStudentStop: async (data) => {
    const response = await axiosInstance.post('/transport/assign-stop', data);
    return response.data;
  },

  getLiveLocations: async () => {
    const response = await axiosInstance.get('/transport/live-locations');
    return response.data;
  },

  getVehicles: async () => {
    const response = await axiosInstance.get('/transport/vehicles');
    return response.data;
  },

  sendAlert: async (alertData) => {
    const response = await axiosInstance.post('/transport/alerts', alertData);
    return response.data;
  },

  // Fee APIs
  getAllFees: async () => {
    const response = await axiosInstance.get('/fee');
    return response.data;
  },

  getMyFees: async () => {
    const response = await axiosInstance.get('/fee/my-fees');
    return response.data;
  },

  createFee: async (feeData) => {
    const response = await axiosInstance.post('/fee', feeData);
    return response.data;
  },

  payFee: async (id, paymentMethod = 'Online UPI / Card') => {
    const response = await axiosInstance.patch(`/fee/${id}/pay`, { paymentMethod });
    return response.data;
  },
};

export default transportService;


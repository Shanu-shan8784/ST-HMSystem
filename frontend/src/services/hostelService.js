import axiosInstance from './axiosInstance';

export const hostelService = {
  // Rooms
  getRooms: async () => {
    const response = await axiosInstance.get('/hostel/rooms');
    return response.data;
  },

  allocateRoom: async (allocationData) => {
    const response = await axiosInstance.post('/hostel/rooms/allocate', allocationData);
    return response.data;
  },

  swapStudents: async (swapData) => {
    const response = await axiosInstance.post('/hostel/rooms/swap', swapData);
    return response.data;
  },

  updateRoomStatus: async (roomId, status) => {
    const response = await axiosInstance.patch(`/hostel/rooms/${roomId}/status`, { status });
    return response.data;
  },

  // Mess Menu
  getMessMenu: async () => {
    const response = await axiosInstance.get('/hostel/mess-menu');
    return response.data;
  },

  // Outpass / Leaves
  getLeaveRequests: async () => {
    const response = await axiosInstance.get('/hostel/leave-requests');
    return response.data;
  },

  applyOutpass: async (outpassData) => {
    const response = await axiosInstance.post('/hostel/outpass', outpassData);
    return response.data;
  },

  updateOutpassStatus: async (id, status, remarks) => {
    const response = await axiosInstance.patch(`/hostel/outpass/${id}/status`, { status, remarks });
    return response.data;
  },

  // Complaints
  getComplaints: async () => {
    const response = await axiosInstance.get('/complaint');
    return response.data;
  },

  createComplaint: async (complaintData) => {
    const response = await axiosInstance.post('/complaint', complaintData);
    return response.data;
  },

  updateComplaintStatus: async (id, status, resolutionNotes) => {
    const response = await axiosInstance.patch(`/complaint/${id}/status`, { status, resolutionNotes });
    return response.data;
  },
};

export default hostelService;


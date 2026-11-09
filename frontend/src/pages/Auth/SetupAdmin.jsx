import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Admin registration from the frontend is strictly disabled.
 * Master Administrator is initialized once directly in MongoDB Atlas from the backend.
 */
const SetupAdmin = () => {
  return <Navigate to="/login" replace />;
};

export default SetupAdmin;

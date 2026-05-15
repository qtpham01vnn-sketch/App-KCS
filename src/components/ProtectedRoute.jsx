import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Clock, LogOut } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  return children;
};

export default ProtectedRoute;

import { useState, useEffect } from 'react';
import { adminService, AdminStatus } from '@/services/adminService';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        const status = await adminService.checkAdminStatus();
        setAdminStatus(status);
        setIsAdmin(status.is_admin);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to check admin status');
        setIsAdmin(false);
        setAdminStatus(null);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  return {
    isAdmin,
    adminStatus,
    loading,
    error,
  };
}



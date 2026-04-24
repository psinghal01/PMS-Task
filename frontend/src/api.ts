import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getPatients = () => api.get('/patients');
export const getDepartments = () => api.get('/departments');
export const getBriefing = (patientId: string, deptId: string) => 
  api.get(`/patients/${patientId}/briefing`, { params: { department_id: deptId } });
export const getHistory = (patientId: string, deptId: string) => 
  api.get(`/consult/history/${patientId}`, { params: { department_id: deptId } });

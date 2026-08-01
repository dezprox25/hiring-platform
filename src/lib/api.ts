import axios, { AxiosError, type AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { getHttpApiBaseUrl } from '@/lib/api-base';

if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.warn('VITE_API_URL is not defined in production environment!');
}

const BASE_URL = getHttpApiBaseUrl();

/** Nest global response wrapper `{ data: T; status: string }` */
export function unwrapData<T>(res: AxiosResponse<{ data: T; status?: string }>): T {
  return res.data.data;
}

export interface ApiError {
  message: string;
  errorCode?: string;
  details?: any;
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the token
api.interceptors.request.use((config) => {
  //  Authorization 头
  const isLoginRequest = config.url?.includes('/auth/login');
  
  const token = localStorage.getItem('accessToken');
  if (token && !isLoginRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle token refresh and global errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as any;
    
    // Handle 401 Unauthorized
    const isLoginRequest = originalRequest.url?.includes('/auth/login');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');

        // Use a clean axios instance to avoid infinite loops
        const refreshUrl = BASE_URL ? `${BASE_URL}/auth/refresh` : '/auth/refresh';
        const response = await axios.post(refreshUrl, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear storage and redirect to login if refresh fails
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Global error notification
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    
    if (error.response?.status === 403) {
      toast.error('Access forbidden', { description: 'You do not have permission to perform this action.' });
    } else if (error.response?.status === 500) {
      toast.error('Server Error', { description: 'Something went wrong on our end. Please try again later.' });
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Network Error', { description: 'Please check your internet connection.' });
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) => api.post('/auth/reset-password', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
};

export const candidatesApi = {
  findAll: (params?: {
    status?: string;
    roleApplied?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/candidates', { params }),
  findOne: (id: string) => api.get(`/candidates/${id}`),
  findMe: () => api.get('/candidates/me'),
  create: (data: any) => api.post('/candidates', data),
  update: (id: string, data: any) => api.patch(`/candidates/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/candidates/${id}/status`, { status }),
  resendInvite: (id: string) => api.post(`/candidates/${id}/invite`),
  delete: (id: string) => api.delete(`/candidates/${id}`),
};

export const analyticsApi = {
  getDashboardData: (params?: {
    startDate?: string;
    endDate?: string;
    roleApplied?: string;
  }) => api.get('/analytics', { params }),
  getDashboardStats: (params?: { startDate?: string; endDate?: string; roleApplied?: string }) =>
    api.get('/analytics/dashboard', { params }),
  getRadarData: (candidateId: string) => api.get(`/analytics/radar/${candidateId}`),
  getTopicBreakdown: (params?: { startDate?: string; endDate?: string; roleApplied?: string }) =>
    api.get('/analytics/topics', { params }),
  getPassFailRatio: (params?: { startDate?: string; endDate?: string; roleApplied?: string }) =>
    api.get('/analytics/pass-fail', { params }),
  getHiringTrends: (params?: { startDate?: string; endDate?: string; roleApplied?: string }) =>
    api.get('/analytics/trends', { params }),
  getLeaderboard: (params?: { startDate?: string; endDate?: string; roleApplied?: string }) =>
    api.get('/analytics/leaderboard', { params }),
  getScoreDistribution: (params?: { startDate?: string; endDate?: string; roleApplied?: string }) =>
    api.get('/analytics/scores/distribution', { params }),
};

export const reportsApi = {
  findAll: (params?: {
    roleApplied?: string;
    isShortlisted?: boolean;
    minScore?: number;
    maxScore?: number;
    page?: number;
    limit?: number;
  }) => api.get('/reports', { params }),
  findById: (id: string) => api.get(`/reports/${id}`),
  findMyReport: () => api.get('/reports/me'),
  releaseResult: (id: string, message: string) => api.patch(`/reports/${id}/release`, { message }),
  toggleShortlist: (id: string) => api.patch(`/reports/${id}/shortlist`),
  addFeedback: (
    id: string,
    data: {
      overallRating: number;
      technicalComment?: string;
      communicationComment?: string;
      recommendation: 'hire' | 'reject' | 'hold';
    },
  ) => api.post(`/reports/${id}/feedback`, data),
  getFeedback: (id: string) => api.get(`/reports/${id}/feedback`),
};

export const questionBankApi = {
  getMcqQuestions: (params?: any) => api.get('/question-bank/mcq', { params }),
  getCodingQuestions: (params?: any) => api.get('/question-bank/coding', { params }),
  getMcqById: (id: string) => api.get(`/question-bank/mcq/${id}`),
  getCodingById: (id: string) => api.get(`/question-bank/coding/${id}`),
  createMcq: (data: any) => api.post('/question-bank/mcq', data),
  createCoding: (data: any) => api.post('/question-bank/coding', data),
  updateMcq: (id: string, data: any) => api.patch(`/question-bank/mcq/${id}`, data),
  updateCoding: (id: string, data: any) => api.patch(`/question-bank/coding/${id}`, data),
  deleteMcq: (id: string) => api.delete(`/question-bank/mcq/${id}`),
  deleteCoding: (id: string) => api.delete(`/question-bank/coding/${id}`),
};

export const assessmentApi = {
  getAssessment: (id: string) => api.get(`/assessments/${id}`),
  getAssessmentStatus: (id: string) => api.get(`/assessments/${id}/status`),
  startAssessment: (id: string) => api.post(`/assessments/${id}/start`),
  getMcqQuestions: (id: string) => api.get(`/assessments/${id}/mcq/questions`),
  getTypingPassage: (id: string) => api.get(`/assessments/${id}/typing/passage`),
  saveMcqAnswer: (id: string, data: { answers: { questionId: string; selectedOption: string }[] }) => 
    api.post(`/assessments/${id}/mcq/submit`, data),
  saveTypingResult: (id: string, data: { wpm: number; accuracy: number; mistakes: number; text: string; timeTakenSeconds: number }) => 
    api.post(`/assessments/${id}/typing/submit`, data),
  saveCodingAutosave: (id: string, data: { code: string; language: string }) => 
    api.post(`/assessments/${id}/coding/autosave`, data),
  submitCoding: (id: string, data: { code: string; language: string }) => 
    api.post(`/assessments/${id}/coding/submit`, data),
  submitAssessment: (id: string) => api.post(`/assessments/${id}/submit`),
  getCodingQuestion: (id: string) => api.get(`/assessments/${id}/coding/question`),
  getCodingSubmission: (id: string) => api.get(`/assessments/${id}/coding/submission`),
  submitManagerReview: (id: string, data: { managerScore: number; managerFeedback: string }) => 
    api.post(`/assessments/${id}/coding/review`, data),
};

export const aiEvaluationApi = {
  retrigger: (candidateId: string, body?: { force?: boolean }) =>
    api.post(`/ai-evaluations/${candidateId}/trigger`, body ?? {}),
  getByCandidate: (candidateId: string) => api.get(`/ai-evaluations/${candidateId}`),
  getStatus: (candidateId: string) => api.get(`/ai-evaluations/${candidateId}/status`),
};

export const usersApi = {
  findAll: () => api.get('/users'),
  create: (data: { email: string; role: string; password?: string; is_active?: boolean }) => api.post('/users', data),
  update: (id: string, data: { role?: string; is_active?: boolean; password?: string }) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export default api;

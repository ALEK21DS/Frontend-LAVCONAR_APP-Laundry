import { createAuthenticatedAxiosInstance } from '@/helpers/axios-instance.helper';

export const authorizationsApi = createAuthenticatedAxiosInstance('/admin-authorizations');


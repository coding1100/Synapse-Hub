import { AxiosError } from 'axios';

export function resolveApiError(error: unknown, fallback = 'Request failed.') {
  const axiosError = error as AxiosError<{ message?: string | string[] }>;
  const payloadMessage = axiosError.response?.data?.message;

  if (Array.isArray(payloadMessage)) {
    return payloadMessage[0] ?? fallback;
  }

  return payloadMessage ?? fallback;
}

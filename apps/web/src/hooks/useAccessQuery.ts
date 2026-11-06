import { useQuery } from '@tanstack/react-query';
import { accessQueryKey, checkAccessCode, readAccessCode } from '@/lib/access-code';

/** Whether the remembered code (or no code, locally) lets this browser use the API. */
export function useAccessQuery() {
  return useQuery({
    queryKey: accessQueryKey,
    queryFn: () => checkAccessCode(readAccessCode()),
    staleTime: Infinity,
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accessQueryKey, checkAccessCode, storeAccessCode } from '@/lib/access-code';

/** Checks a typed code; a good one is remembered and opens the app. */
export function useUnlockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const ok = await checkAccessCode(code);
      if (ok) storeAccessCode(code);
      return ok;
    },
    onSuccess: (ok) => {
      if (ok) queryClient.setQueryData(accessQueryKey, true);
    },
  });
}

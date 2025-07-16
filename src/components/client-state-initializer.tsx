
'use client';

import { useUserStore } from '@/hooks/use-user-store';
import { useEffect } from 'react';

// This component is a workaround to ensure zustand state is rehydrated on the client
// see: https://docs.pmnd.rs/zustand/integrations/nextjs#app-router-and-server-components
export function ClientStateInitializer() {
    useEffect(() => {
        useUserStore.persist.rehydrate();
    }, []);

    return null;
}

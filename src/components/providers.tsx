'use client';

import {
    createContext,
    useContext,
    useState,
    useSyncExternalStore,
    type ReactNode,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';

// ── Sidebar State ──
interface SidebarContextType {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
    collapsed: false,
    setCollapsed: () => { },
});
const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed';

const subscribeToSidebarStorage = (onStoreChange: () => void) => {
    window.addEventListener('storage', onStoreChange);
    return () => window.removeEventListener('storage', onStoreChange);
};

const getSidebarSnapshot = () => localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';

export function useSidebar() {
    return useContext(SidebarContext);
}

function SidebarProvider({ children }: { children: ReactNode }) {
    const collapsed = useSyncExternalStore(
        subscribeToSidebarStorage,
        getSidebarSnapshot,
        () => false
    );

    const setCollapsed = (v: boolean) => {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(v));
        window.dispatchEvent(new Event('storage'));
    };

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

// ── Main Providers ──
export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30 * 1000,
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider delay={0}>
                <SidebarProvider>
                    {children}
                    <Toaster
                        position="bottom-right"
                        richColors
                        closeButton
                        toastOptions={{
                            className: 'font-sans',
                        }}
                    />
                </SidebarProvider>
            </TooltipProvider>
        </QueryClientProvider>
    );
}

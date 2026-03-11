'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
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

export function useSidebar() {
    return useContext(SidebarContext);
}

function SidebarProvider({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsedState] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('sidebar-collapsed');
        if (stored === 'true') setCollapsedState(true);
    }, []);

    const setCollapsed = (v: boolean) => {
        setCollapsedState(v);
        localStorage.setItem('sidebar-collapsed', String(v));
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

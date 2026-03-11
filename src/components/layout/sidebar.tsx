'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FileSearch,
    Layers,
    History,
    Settings,
    ShieldCheck,
    PanelLeftClose,
    PanelLeftOpen,
    LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/providers';

const mainNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Auditoría Individual', href: '/audit/single', icon: FileSearch },
    { label: 'Auditoría por Lotes', href: '/audit/batch', icon: Layers },
    { label: 'Historial', href: '/audit/history', icon: History },
];

const secondaryNav = [
    { label: 'Configuración', href: '/settings', icon: Settings },
];

function NavItem({
    item,
    isActive,
    collapsed,
}: {
    item: (typeof mainNav)[0];
    isActive: boolean;
    collapsed: boolean;
}) {
    return (
        <Link
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                    ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/80',
                collapsed && 'justify-center px-2'
            )}
        >
            {/* Active indicator pill */}
            {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary animate-fade-in" />
            )}
            <item.icon
                className={cn(
                    'h-[18px] w-[18px] flex-shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
            />
            {!collapsed && (
                <span className="truncate">{item.label}</span>
            )}
        </Link>
    );
}

export function Sidebar() {
    const pathname = usePathname();
    const { collapsed, setCollapsed } = useSidebar();

    return (
        <aside
            className={cn(
                'hidden lg:flex flex-col border-r border-sidebar-border/60 bg-sidebar backdrop-blur-xl transition-all duration-300 ease-in-out',
                collapsed ? 'w-[68px]' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className={cn(
                'flex items-center h-16 border-b border-sidebar-border/60 transition-all duration-300',
                collapsed ? 'justify-center px-2' : 'gap-3 px-5'
            )}>
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 animate-glow-pulse">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                {!collapsed && (
                    <div className="animate-fade-in">
                        <h1 className="text-base font-bold tracking-tight">AudFact</h1>
                        <p className="text-[0.6rem] text-muted-foreground leading-none">
                            Auditoría Inteligente
                        </p>
                    </div>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {mainNav.map((item) => {
                    const isActive =
                        pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <NavItem
                            key={item.href}
                            item={item}
                            isActive={isActive}
                            collapsed={collapsed}
                        />
                    );
                })}

                <Separator className="my-3 opacity-50" />

                {secondaryNav.map((item) => {
                    const isActive =
                        pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <NavItem
                            key={item.href}
                            item={item}
                            isActive={isActive}
                            collapsed={collapsed}
                        />
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-sidebar-border/60 p-2 space-y-1">
                {/* Collapse toggle */}
                <Button
                    variant="ghost"
                    size="sm"
                    title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                    className={cn(
                        'w-full justify-center text-muted-foreground hover:text-foreground',
                        !collapsed && 'justify-start gap-3 px-3'
                    )}
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? (
                        <PanelLeftOpen className="h-4 w-4" />
                    ) : (
                        <>
                            <PanelLeftClose className="h-4 w-4" />
                            <span className="text-xs">Colapsar</span>
                        </>
                    )}
                </Button>

                {/* User section */}
                {!collapsed && (
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/30 border border-border/30 animate-fade-in">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            AU
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">Auditor</p>
                            <p className="text-[0.6rem] text-muted-foreground truncate">
                                Sistema IA
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Cerrar sesión">
                            <LogOut className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}
            </div>
        </aside>
    );
}

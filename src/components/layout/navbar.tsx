'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Bell,
    User,
    Menu,
    Search,
    LayoutDashboard,
    FileSearch,
    Layers,
    History,
    Settings,
    ShieldCheck,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Auditoría Individual', href: '/audit/single', icon: FileSearch },
    { label: 'Auditoría por Lotes', href: '/audit/batch', icon: Layers },
    { label: 'Historial', href: '/audit/history', icon: History },
    { label: 'Configuración', href: '/settings', icon: Settings },
];

function Breadcrumbs() {
    const pathname = usePathname();

    const segments = pathname.split('/').filter(Boolean);
    const crumbs = segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/');
        const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
        return { label, href };
    });

    return (
        <nav aria-label="breadcrumb" className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            {crumbs.map((crumb, i) => (
                <span key={crumb.href} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3" />}
                    {i === crumbs.length - 1 ? (
                        <span className="text-foreground font-medium">{crumb.label}</span>
                    ) : (
                        <Link href={crumb.href} className="hover:text-foreground transition-colors">
                            {crumb.label}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    );
}

export function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const currentNav = navItems.find(
        (i) => pathname === i.href || pathname.startsWith(i.href + '/')
    );
    const pageTitle = currentNav?.label || 'AudFact';

    // Command palette trigger
    const handleSearchClick = useCallback(() => {
        const event = new CustomEvent('open-command-palette');
        window.dispatchEvent(event);
    }, []);

    // Keyboard shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSearchClick();
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [handleSearchClick]);

    return (
        <header className="h-14 border-b border-border/50 bg-background/90 backdrop-blur-xl flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-30">
            {/* Mobile toggle */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger className="lg:hidden inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors">
                    <Menu className="h-4 w-4" />
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                    <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                    <div className="flex items-center gap-3 px-5 h-14 border-b border-border">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold text-sm">AudFact</span>
                    </div>
                    <nav className="px-2 py-3 space-y-1">
                        {navItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </SheetContent>
            </Sheet>

            {/* Page title + breadcrumbs */}
            <div className="flex flex-col gap-0.5 min-w-0">
                <h2 className="text-sm font-semibold tracking-tight truncate">{pageTitle}</h2>
                <Breadcrumbs />
            </div>

            <div className="flex-1" />

            {/* Search trigger */}
            <Button
                variant="outline"
                className="hidden sm:inline-flex h-8 w-56 justify-start gap-2 text-xs text-muted-foreground font-normal bg-muted/20 border-border/40 hover:bg-accent hover:border-primary/30 transition-all duration-200"
                onClick={handleSearchClick}
            >
                <Search className="h-3.5 w-3.5" />
                <span>Buscar...</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    Ctrl K
                </kbd>
            </Button>

            {/* Mobile search */}
            <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8" onClick={handleSearchClick}>
                <Search className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-5 hidden sm:block" />

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                </span>
            </Button>

            {/* User menu */}
            <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 ring-1 ring-primary/20 hover:bg-primary/20 hover:ring-primary/40 transition-all duration-200">
                    <User className="h-4 w-4 text-primary" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium">Auditor</p>
                                <p className="text-xs text-muted-foreground">
                                    Sistema de Auditoría IA
                                </p>
                            </div>
                        </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Perfil</DropdownMenuItem>
                    <DropdownMenuItem>Preferencias</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                        Cerrar sesión
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}

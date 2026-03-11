'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    FileSearch,
    Layers,
    History,
    Settings,
    Search,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CommandItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    group: string;
}

const commands: CommandItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'Navegación' },
    { label: 'Auditoría Individual', href: '/audit/single', icon: FileSearch, group: 'Navegación' },
    { label: 'Auditoría por Lotes', href: '/audit/batch', icon: Layers, group: 'Navegación' },
    { label: 'Historial de Auditorías', href: '/audit/history', icon: History, group: 'Navegación' },
    { label: 'Configuración', href: '/settings', icon: Settings, group: 'Navegación' },
];

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const router = useRouter();

    // Listen for custom event from navbar
    useEffect(() => {
        const handler = () => setOpen(true);
        window.addEventListener('open-command-palette', handler);
        return () => window.removeEventListener('open-command-palette', handler);
    }, []);

    // Keyboard shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const filtered = commands.filter((cmd) =>
        cmd.label.toLowerCase().includes(search.toLowerCase())
    );

    const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
        (acc[cmd.group] ??= []).push(cmd);
        return acc;
    }, {});

    const handleSelect = useCallback((href: string) => {
        setOpen(false);
        setSearch('');
        router.push(href);
    }, [router]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-lg p-0 overflow-hidden rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl">
                <DialogTitle className="sr-only">Búsqueda rápida</DialogTitle>
                {/* Search input */}
                <div className="flex items-center gap-2 px-4 border-b border-border">
                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                        placeholder="Escribe un comando o búsqueda..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-12 border-0 bg-transparent text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                        autoFocus
                    />
                    <kbd className="inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                        Esc
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[300px] overflow-y-auto p-2">
                    {Object.keys(groups).length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            No se encontraron resultados.
                        </p>
                    ) : (
                        Object.entries(groups).map(([group, items]) => (
                            <div key={group}>
                                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {group}
                                </p>
                                {items.map((item) => (
                                    <button
                                        key={item.href}
                                        onClick={() => handleSelect(item.href)}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                                            'text-foreground hover:bg-accent cursor-pointer'
                                        )}
                                    >
                                        <item.icon className="h-4 w-4 text-muted-foreground" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

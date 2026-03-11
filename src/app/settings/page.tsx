import React from 'react';
import { Settings, Shield, Bell, Key, Database, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Configuración
                </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* General Settings */}
                <Card className="bg-slate-900 border-slate-800 backdrop-blur-sm bg-opacity-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xl font-medium text-slate-100 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-indigo-400" />
                            General
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-slate-400 mt-2 mb-4">
                            Ajustes generales de la aplicación y preferencias de visualización.
                        </CardDescription>
                        <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                            Ir a General
                        </Button>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="bg-slate-900 border-slate-800 backdrop-blur-sm bg-opacity-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xl font-medium text-slate-100 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            Seguridad
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-slate-400 mt-2 mb-4">
                            Gestión de contraseñas, 2FA y sesiones activas.
                        </CardDescription>
                        <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                            Ir a Seguridad
                        </Button>
                    </CardContent>
                </Card>

                {/* Audit Engine Settings */}
                <Card className="bg-slate-900 border-slate-800 backdrop-blur-sm bg-opacity-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xl font-medium text-slate-100 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-400" />
                            Motor de Auditoría
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-slate-400 mt-2 mb-4">
                            Configuración de las reglas de Gemini, temperaturas y umbrales.
                        </CardDescription>
                        <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                            Ir a Motor IA
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4">
                <div className="flex items-center gap-4">
                    <div className="rounded-full bg-indigo-500/20 p-2">
                        <Settings className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-indigo-200">Módulo en Construcción</h3>
                        <p className="text-sm text-indigo-300/70">
                            Este panel de configuración estará disponible en la próxima versión.
                            Por ahora, puede gestionar la aplicación mediante las variables de entorno de Docker.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

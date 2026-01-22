'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Building2,
    FileText,
    Upload,
    Shield,
    LogOut,
    FileCheck
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Building2, label: 'Empresas', href: '/dashboard/empresas' },
    { icon: Upload, label: 'Upload', href: '/dashboard/upload' },
    { icon: FileText, label: 'Documentos', href: '/dashboard/documentos' },
    { icon: FileCheck, label: 'Logs', href: '/dashboard/logs' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg">DocPortal</h1>
                        <p className="text-slate-400 text-xs">Admin</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? 'bg-purple-600 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{user?.nome}</p>
                        <p className="text-slate-400 text-xs truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sair</span>
                </button>
            </div>
        </div>
    );
}

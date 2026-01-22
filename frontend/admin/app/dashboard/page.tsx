'use client';

import { useEffect, useState } from 'react';
import { documentosAPI, empresasAPI } from '@/lib/api';
import { FileText, Building2, Upload, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalEmpresas: 0,
        totalDocumentos: 0,
        documentosPendentes: 0,
        uploadsMes: 0,
    });
    const [recentDocs, setRecentDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [empresasRes, docsRes] = await Promise.all([
                empresasAPI.list({ page: 1, limit: 1 }),
                documentosAPI.list({ page: 1, limit: 5 }),
            ]);

            setStats({
                totalEmpresas: empresasRes.data.pagination.total,
                totalDocumentos: docsRes.data.pagination.total,
                documentosPendentes: docsRes.data.documentos.filter((d: any) => d.status === 'PROCESSANDO').length,
                uploadsMes: docsRes.data.pagination.total, // Simplificado
            });

            setRecentDocs(docsRes.data.documentos);
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            icon: Building2,
            label: 'Empresas Cadastradas',
            value: stats.totalEmpresas,
            color: 'bg-blue-600',
        },
        {
            icon: FileText,
            label: 'Total de Documentos',
            value: stats.totalDocumentos,
            color: 'bg-purple-600',
        },
        {
            icon: Upload,
            label: 'Uploads Este Mês',
            value: stats.uploadsMes,
            color: 'bg-green-600',
        },
        {
            icon: AlertCircle,
            label: 'Processando',
            value: stats.documentosPendentes,
            color: 'bg-orange-600',
        },
    ];

    const getStatusBadge = (status: string) => {
        const badges: any = {
            DISPONIVEL: { label: 'Disponível', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
            PROCESSANDO: { label: 'Processando', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
            VISUALIZADO: { label: 'Visualizado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
            ERRO_PROCESSAMENTO: { label: 'Erro', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
        };

        const badge = badges[status] || badges.DISPONIVEL;
        return (
            <span className={`px-2 py-1 text-xs rounded-full border ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-slate-400">Visão geral do sistema de documentos</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="card animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                                </div>
                                <div className={`${stat.color} p-3 rounded-lg`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Documents */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Documentos Recentes</h2>
                    <a href="/dashboard/documentos" className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                        Ver todos →
                    </a>
                </div>

                <div className="space-y-3">
                    {recentDocs.length === 0 ? (
                        <p className="text-slate-400 text-center py-8">Nenhum documento encontrado</p>
                    ) : (
                        recentDocs.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-all"
                            >
                                <div className="flex items-center space-x-4 flex-1">
                                    <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">{doc.nomeArquivo}</p>
                                        <p className="text-slate-400 text-sm">{doc.empresa?.razaoSocial}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-slate-400 text-sm">{doc.categoria}</span>
                                    {getStatusBadge(doc.status)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

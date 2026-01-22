'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { documentosAPI, empresasAPI } from '@/lib/api';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Building2 } from 'lucide-react';

export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [empresaId, setEmpresaId] = useState('');
    const [empresas, setEmpresas] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    // Carregar empresas
    useState(() => {
        empresasAPI.list({ limit: 100 }).then((res) => {
            setEmpresas(res.data.empresas);
        });
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles((prev) => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
        maxFiles: 100,
    });

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (!empresaId) {
            alert('Selecione uma empresa');
            return;
        }

        if (files.length === 0) {
            alert('Adicione pelo menos um arquivo');
            return;
        }

        setUploading(true);
        setResults([]);

        try {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('files', file);
            });
            formData.append('empresaId', empresaId);

            const response = await documentosAPI.upload(formData);
            setResults(response.data.results);

            // Limpar arquivos com sucesso
            const successIds = response.data.results
                .filter((r: any) => r.success)
                .map((r: any) => r.fileName);

            setFiles((prev) => prev.filter((f) => !successIds.includes(f.name)));
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao fazer upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Upload de Documentos</h1>
                <p className="text-slate-400">Envie documentos em lote para processamento automático</p>
            </div>

            {/* Empresa Selection */}
            <div className="card">
                <label className="label">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Selecione a Empresa
                </label>
                <select
                    value={empresaId}
                    onChange={(e) => setEmpresaId(e.target.value)}
                    className="input"
                >
                    <option value="">Selecione...</option>
                    {empresas.map((empresa) => (
                        <option key={empresa.id} value={empresa.id}>
                            {empresa.razaoSocial} - {empresa.cnpj}
                        </option>
                    ))}
                </select>
            </div>

            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`card cursor-pointer transition-all border-2 border-dashed ${isDragActive
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-700 hover:border-purple-500/50'
                    }`}
            >
                <input {...getInputProps()} />
                <div className="text-center py-12">
                    <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragActive ? 'text-purple-400' : 'text-slate-400'}`} />
                    <p className="text-white text-lg font-medium mb-2">
                        {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos PDF ou clique para selecionar'}
                    </p>
                    <p className="text-slate-400 text-sm">
                        Até 100 arquivos PDF por vez
                    </p>
                </div>
            </div>

            {/* Files List */}
            {files.length > 0 && (
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-medium">
                            Arquivos Selecionados ({files.length})
                        </h3>
                        <button
                            onClick={() => setFiles([])}
                            className="text-red-400 hover:text-red-300 text-sm"
                        >
                            Limpar todos
                        </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {files.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <FileText className="w-5 h-5 text-purple-400" />
                                    <div>
                                        <p className="text-white text-sm">{file.name}</p>
                                        <p className="text-slate-400 text-xs">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFile(index)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={uploading || !empresaId}
                        className="btn btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <span className="flex items-center justify-center">
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Enviando...
                            </span>
                        ) : (
                            `Enviar ${files.length} arquivo${files.length > 1 ? 's' : ''}`
                        )}
                    </button>
                </div>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div className="card">
                    <h3 className="text-white font-medium mb-4">Resultados do Upload</h3>
                    <div className="space-y-2">
                        {results.map((result, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-lg ${result.success
                                        ? 'bg-green-500/10 border border-green-500/50'
                                        : 'bg-red-500/10 border border-red-500/50'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    {result.success ? (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-400" />
                                    )}
                                    <p className={result.success ? 'text-green-400' : 'text-red-400'}>
                                        {result.fileName}
                                    </p>
                                </div>
                                {result.success && (
                                    <span className="text-xs text-slate-400">
                                        Job ID: {result.jobId?.substring(0, 8)}...
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

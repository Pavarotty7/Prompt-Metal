import React, { useState } from 'react';
import { storage, auth } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const StorageDemo: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [url, setUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        setError(null);
        if (!auth.currentUser) {
            setError('É necessário fazer login para carregar arquivos.');
            return;
        }
        if (!file) return;
        setUploading(true);
        try {
            const storageRef = ref(storage, `uploads/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
            const task = uploadBytesResumable(storageRef, file);
            task.on('state_changed', () => { }, (err) => {
                console.error(err);
                setError('Erro no upload');
                setUploading(false);
            }, async () => {
                const downloadUrl = await getDownloadURL(task.snapshot.ref);
                setUrl(downloadUrl);
                setUploading(false);
            });
        } catch (err: any) {
            console.error(err);
            setError(err?.message || 'Erro ao enviar arquivo.');
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow space-y-3">
            <h2 className="text-lg font-semibold">Firebase Storage</h2>
            <input type="file" onChange={handleFileChange} />
            <div className="flex gap-2">
                <button onClick={handleUpload} disabled={uploading} className="px-3 py-2 bg-amber-500 text-white rounded">Upload</button>
            </div>
            {error && <p className="text-red-500">{error}</p>}
            {uploading && <p>Enviando...</p>}
            {url && (
                <div>
                    <p className="text-sm">Arquivo enviado:</p>
                    <a className="text-blue-600" href={url} target="_blank" rel="noreferrer">{url}</a>
                </div>
            )}
        </div>
    );
};

export default StorageDemo;

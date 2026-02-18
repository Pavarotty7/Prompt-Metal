import React, { useEffect, useState } from 'react';
import { db, auth } from '../services/firebase';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Message {
    id?: string;
    text: string;
    uid?: string;
    createdAt?: any;
}

const FirestoreDemo: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [permissionError, setPermissionError] = useState<string | null>(null);

    const fetchMessages = async () => {
        setPermissionError(null);
        if (!auth.currentUser) {
            setPermissionError('É necessário fazer login para ler mensagens.');
            return;
        }
        setLoading(true);
        try {
            const col = collection(db, 'messages');
            const snapshot = await getDocs(col);
            const data = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
            setMessages(data);
        } catch (err: any) {
            console.error('Erro buscando mensagens', err);
            setPermissionError(err?.message || 'Erro ao buscar mensagens.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            // Recarrega mensagens quando o usuário faz login/logout
            if (u) fetchMessages();
            else setMessages([]);
        });
        return () => unsub();
    }, []);

    const handleAdd = async () => {
        setPermissionError(null);
        if (!auth.currentUser) {
            setPermissionError('É necessário fazer login para enviar mensagens.');
            return;
        }
        if (!text.trim()) return;
        setLoading(true);
        try {
            const col = collection(db, 'messages');
            await addDoc(col, {
                text,
                uid: auth.currentUser?.uid || null,
                createdAt: Timestamp.now()
            });
            setText('');
            await fetchMessages();
        } catch (err: any) {
            console.error('Erro adicionando mensagem', err);
            setPermissionError(err?.message || 'Erro ao adicionar mensagem.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-semibold">Firestore: mensagens</h2>

            <div className="flex gap-2">
                <input className="flex-1 p-2 border rounded" placeholder="Escreva uma mensagem" value={text} onChange={e => setText(e.target.value)} />
                <button onClick={handleAdd} className="px-3 py-2 bg-amber-500 text-white rounded" disabled={loading}>Enviar</button>
            </div>

            <div>
                {permissionError && <p className="text-sm text-red-500 mb-2">{permissionError}</p>}
                {loading ? <p>Carregando...</p> : (
                    <ul className="space-y-2 max-h-64 overflow-auto">
                        {messages.map((m) => (
                            <li key={m.id} className="p-2 border rounded">
                                <div className="text-sm text-slate-500">{m.uid || 'anon'}</div>
                                <div>{m.text}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default FirestoreDemo;

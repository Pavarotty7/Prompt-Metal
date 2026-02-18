import React, { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    User
} from 'firebase/auth';

const provider = new GoogleAuthProvider();

const AuthView: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsub();
    }, []);

    const handleSignUp = async () => {
        setLoading(true);
        setError(null);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message || 'Erro ao entrar');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut(auth);
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            setError(err.message || 'Erro no login com Google');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Autenticação Firebase</h2>

            {user ? (
                <div>
                    <p className="mb-2">Conectado como <strong>{user.email}</strong></p>
                    <button onClick={handleSignOut} className="px-3 py-2 bg-amber-500 text-white rounded">Sair</button>
                </div>
            ) : (
                <div className="space-y-3">
                    <input className="w-full p-2 border rounded" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                    <input className="w-full p-2 border rounded" placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    <div className="flex gap-2">
                        <button onClick={handleSignIn} disabled={loading} className="px-3 py-2 bg-slate-800 text-white rounded">Entrar</button>
                        <button onClick={handleSignUp} disabled={loading} className="px-3 py-2 bg-amber-500 text-white rounded">Criar conta</button>
                        <button onClick={handleGoogleSignIn} disabled={loading} className="px-3 py-2 bg-blue-500 text-white rounded">Google</button>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
            )}
        </div>
    );
};

export default AuthView;

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Inicializa o Supabase usando variáveis de ambiente Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Não lançar erro aqui — permitimos placeholders em dev. Substitua no .env.local.
    console.warn('Supabase não configurado: verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helpers simples para uso no app
export async function getProjects() {
    const { data, error } = await supabase.from('projects').select('*').order('startDate', { ascending: false });
    if (error) throw error;
    return data;
}

export async function addProject(project: any) {
    const { data, error } = await supabase.from('projects').insert([project]);
    if (error) throw error;
    return data;
}

export async function getMessages() {
    const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function addMessage(message: { text: string; user_id?: string }) {
    const payload = { text: message.text, user_id: message.user_id || null, created_at: new Date().toISOString() };
    const { data, error } = await supabase.from('messages').insert([payload]);
    if (error) throw error;
    return data;
}

export default supabase;

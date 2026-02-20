
import React, { useState, useMemo } from 'react';
import { DailyNote, UserRole } from '../types';
import {
  StickyNote,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Circle,
  Search,
  Filter,
  X,
  Save,
  Clock
} from 'lucide-react';

interface NotesViewProps {
  notes: DailyNote[];
  onAddNote: (note: DailyNote) => void;
  onUpdateNote: (note: DailyNote) => void;
  onDeleteNote: (id: string) => void;
  userRole: UserRole;
}

const NotesView: React.FC<NotesViewProps> = ({ notes, onAddNote, onUpdateNote, onDeleteNote, userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    content: '',
    priority: 'Média' as DailyNote['priority'],
    date: new Date().toISOString().split('T')[0]
  });

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const safeContent = String(note?.content || '');
      const matchesSearch = safeContent.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || note.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    }).sort((a, b) => {
      // Sort by completion first, then by date
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [notes, searchTerm, priorityFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newNote: DailyNote = {
      id: Math.random().toString(36).substr(2, 9),
      content: formData.content,
      priority: formData.priority,
      date: formData.date,
      completed: false
    };
    onAddNote(newNote);
    setIsModalOpen(false);
    setFormData({
      content: '',
      priority: 'Média',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const toggleComplete = (note: DailyNote) => {
    onUpdateNote({ ...note, completed: !note.completed });
  };

  const getPriorityColor = (priority: DailyNote['priority']) => {
    switch (priority) {
      case 'Crítica': return 'text-red-600 bg-red-50 border-red-100';
      case 'Alta': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'Média': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Baixa': return 'text-slate-500 bg-slate-50 border-slate-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const groupedNotes = useMemo(() => {
    const groups: { [key: string]: DailyNote[] } = {};
    filteredNotes.forEach(note => {
      const safeDate = note?.date || new Date().toISOString().split('T')[0];
      if (!groups[safeDate]) groups[safeDate] = [];
      groups[safeDate].push({ ...note, date: safeDate, content: String(note?.content || '') });
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filteredNotes]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Anotações Diárias</h2>
          <p className="text-slate-500 font-medium italic">Registro de tarefas, lembretes e observações de campo</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-xl active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus size={16} className="text-amber-500" /> Nova Anotação
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar nas anotações..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter size={18} className="text-slate-400" />
          <select
            className="flex-1 md:flex-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase outline-none text-slate-800"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">Todas as Prioridades</option>
            <option value="Crítica">Crítica</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </div>
      </div>

      <div className="space-y-12 relative before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
        {groupedNotes.map(([date, dateNotes]) => (
          <div key={date} className="relative pl-12">
            <div className="absolute left-0 top-0 w-9 h-9 bg-slate-900 rounded-full border-4 border-slate-50 flex items-center justify-center z-10 shadow-md">
              <Calendar size={14} className="text-amber-500" />
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest bg-white inline-block px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
                {new Date(date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dateNotes.map(note => (
                <div
                  key={note.id}
                  className={`bg-white rounded-[2rem] border transition-all p-6 flex flex-col justify-between min-h-[180px] group relative ${note.completed ? 'opacity-60 border-slate-100' : 'border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-400'
                    }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getPriorityColor(note.priority)}`}>
                        {note.priority}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleComplete(note)}
                          className={`p-1.5 rounded-full transition-all ${note.completed ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-slate-600'}`}
                        >
                          {note.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <p className={`text-sm font-black uppercase tracking-tight leading-relaxed ${note.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {note.content}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={12} /> {new Date(note.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {note.completed && (
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Concluída</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {groupedNotes.length === 0 && (
          <div className="py-32 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <StickyNote size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Nenhuma anotação encontrada</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-scale-in">
            <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
              <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <StickyNote size={24} className="text-amber-500" /> Nova Anotação
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Conteúdo da Anotação</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-black outline-none focus:ring-2 focus:ring-slate-800 placeholder:text-slate-400"
                  placeholder="Descreva o lembrete ou observação..."
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Prioridade</label>
                  <select
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-black outline-none"
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Data</label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-black outline-none"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl">Cancelar</button>
                <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all flex items-center gap-2">
                  <Save size={18} className="text-amber-500" /> Salvar Anotação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesView;

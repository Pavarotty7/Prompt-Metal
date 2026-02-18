
import React from 'react';
import {
  LayoutDashboard,
  HardHat,
  Wallet,
  Truck,
  FileCheck,
  BrainCircuit,
  LogOut,
  Home,
  Users,
  ClipboardList,
  CreditCard
} from 'lucide-react';
import { ViewState, UserRole } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  userRole: UserRole;
  onLogout: () => void;
}

const GUEST_ALLOWED_VIEWS: ViewState[] = ['dashboard', 'projects', 'team'];

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, onLogout }) => {
  const menuItems = React.useMemo(() => [
    { id: 'dashboard' as ViewState, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'projects' as ViewState, label: 'Obras & Produção', icon: <HardHat size={20} /> },
    { id: 'timesheet' as ViewState, label: 'Folha de Ponto', icon: <ClipboardList size={20} /> },
    { id: 'finance' as ViewState, label: 'Financeiro', icon: <Wallet size={20} /> },
    { id: 'corporate-cards' as ViewState, label: 'Cartões Corporativos', icon: <CreditCard size={20} /> },
    { id: 'fleet' as ViewState, label: 'Frota & Combustível', icon: <Truck size={20} /> },
    { id: 'team' as ViewState, label: 'Equipe & Organograma', icon: <Users size={20} /> },
    { id: 'compliance' as ViewState, label: 'Compliance & Docs', icon: <FileCheck size={20} /> },
  ], []);

  const visibleMenuItems = React.useMemo(() =>
    userRole === 'admin'
      ? menuItems
      : menuItems.filter(item => GUEST_ALLOWED_VIEWS.includes(item.id)),
    [userRole, menuItems]);

  return (
    <div className="h-screen w-64 bg-[#0a101f] text-white flex flex-col fixed left-0 top-0 shadow-xl z-50">
      <div className="p-8 border-b border-slate-800 cursor-pointer flex items-center justify-center gap-1" onClick={() => onChangeView('home')}>
        <span className="text-xl font-black tracking-tighter text-white uppercase">Prompt</span>
        <span className="text-xl font-black tracking-tighter text-amber-500 uppercase">Metal</span>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        <button
          onClick={() => onChangeView('home')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 mb-4 border border-slate-700/50"
        >
          <Home size={20} />
          <span className="text-sm">Início</span>
        </button>

        <div className="h-px bg-slate-700/50 mx-4 mb-4"></div>

        {visibleMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentView === item.id
              ? 'bg-amber-500 text-slate-900 font-semibold shadow-lg shadow-amber-500/20'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-[#080c17]">
        <div className="mb-4 px-2">
          <span className="text-xs text-slate-500 uppercase font-bold">Perfil</span>
          <p className="text-sm text-slate-300 capitalize">{userRole === 'admin' ? 'Administrador' : 'Convidado'}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm w-full"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(Sidebar);

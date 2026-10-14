import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Grid2X2, Heart, ChartNoAxesCombined, ArrowUpRight, X, LogOut, Plus, Layers3 } from 'lucide-react';
import { useStudio } from '../context.jsx';

const links = [
  { to: '/', icon: Sparkles, label: 'Estudio creativo' },
  { to: '/history', icon: Grid2X2, label: 'Mi biblioteca' },
  { to: '/favorites', icon: Heart, label: 'Favoritos' },
  { to: '/usage', icon: ChartNoAxesCombined, label: 'Uso y créditos' },
];
export default function Sidebar({ open, close }) {
  const { session, signIn, logout, generations } = useStudio();
  return <aside className={`sidebar ${open ? 'is-open' : ''}`}>
    <div className="sidebar-head"><NavLink to="/" className="brand"><span className="brand-symbol">f<span /></span><span>forma<span className="brand-period">.</span></span></NavLink><button className="icon-button mobile-close" aria-label="Cerrar menú" onClick={close}><X size={20} /></button></div>
    <div className="workspace-switch"><div className="workspace-symbol"><Layers3 size={18} /></div><div><strong>Mi espacio creativo</strong><span>El comienzo de algo grande</span></div><span className="workspace-plus"><Plus size={13} /></span></div>
    <span className="nav-label">WORKSPACE</span>
    <nav aria-label="Navegación principal">{links.map(({ to, icon: Icon, label }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={19} strokeWidth={1.7} /><span>{label}</span>{to === '/history' && session?.user && <span className="nav-count">{generations.length}</span>}{to === '/' && <span className="new-badge">NEW</span>}</NavLink>)}</nav>
    <div className="sidebar-bottom">
      <div className="credits-card"><span className="credits-icon"><Sparkles size={19} /></span><h3>{session?.user ? 'Dale forma a tus ideas' : 'Tu imaginación, sin límites'}</h3><p>{session?.user ? `${session.user.credits} créditos disponibles para tu próxima idea.` : 'Un espacio para todo lo que todavía no existe.'}</p>{session?.user ? <NavLink to="/usage" className="credits-link">Ver mis créditos <ArrowUpRight size={15} /></NavLink> : <button className="credits-link" onClick={signIn}>Empieza a crear <ArrowUpRight size={15} /></button>}<div className="credits-decoration" /></div>
      <div className="sidebar-account"><span className="avatar">{session?.user?.name?.slice(0, 1).toUpperCase() || 'F'}</span><div><strong>{session?.user?.name || 'Tu próximo capítulo'}</strong><span>{session?.user ? 'Cuenta personal' : 'Empieza con Google'}</span></div><button className="icon-button" aria-label={session?.user ? 'Cerrar sesión' : 'Iniciar sesión'} onClick={session?.user ? logout : signIn}>{session?.user ? <LogOut size={17} /> : <ArrowUpRight size={17} />}</button></div>
    </div>
  </aside>;
}

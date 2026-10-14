import React, { useCallback, useEffect, useState } from 'react';
import { Route, Routes, useLocation, Link } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, Menu, X, Sparkles, Check, AlertCircle } from 'lucide-react';
import { StudioContext, api } from './context.jsx';
import Sidebar from './components/Sidebar.jsx';
import Studio from './components/Studio.jsx';
import Library from './components/Library.jsx';
import Usage from './components/Usage.jsx';
import SignIn from './components/SignIn.jsx';

const titles = { '/': 'Estudio creativo', '/history': 'Mi biblioteca', '/favorites': 'Favoritos', '/usage': 'Uso y créditos' };
const authErrors = {
  not_configured: 'El acceso con Google aún no está configurado. Añade las credenciales de Google para activarlo.',
  invalid_state: 'No se pudo validar el acceso. Vuelve a intentarlo.',
  expired: 'La solicitud ha caducado. Vuelve a iniciar sesión.',
  failed: 'No se pudo completar el acceso con Google. Vuelve a intentarlo.',
};

export default function App() {
  const [session, setSession] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const refresh = useCallback(async () => {
    try {
      const next = await api('/session');
      setSession(next);
      if (next.user) setGenerations((await api('/generations')).generations);
      else setGenerations([]);
      setError('');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [refresh]);
  useEffect(() => { if (session?.user) setLoginOpen(false); }, [session?.user?.id]);
  useEffect(() => {
    if (!session?.user) return;
    const timer = setInterval(refresh, 6000);
    return () => clearInterval(timer);
  }, [session?.user?.id, refresh]);
  useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0); }, [location.pathname]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const code = new URLSearchParams(location.search).get('authError');
    if (code) { setToast(authErrors[code] || authErrors.failed); setLoginOpen(true); }
  }, [location.search]);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { setLoginOpen(false); setMenuOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const favorite = async generation => {
    try {
      const { generation: updated } = await api(`/generations/${generation.id}/favorite`, {
        method: 'PATCH', body: JSON.stringify({ favorite: !generation.favorite }),
      });
      setGenerations(rows => rows.map(row => row.id === updated.id ? updated : row));
      setToast(updated.favorite ? 'Guardado en favoritos.' : 'Eliminado de favoritos.');
    } catch (e) { setToast(e.message); }
  };
  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); await refresh(); }
    catch (e) { setToast(e.message); }
  };
  const context = { session, generations, loading, refresh, favorite, notify: setToast, signIn: () => setLoginOpen(true), logout };
  return <StudioContext.Provider value={context}>
    <div className="app-shell">
      {menuOpen && <button className="nav-scrim" aria-label="Cerrar navegación" onClick={() => setMenuOpen(false)} />}
      <Sidebar open={menuOpen} close={() => setMenuOpen(false)} />
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Abrir navegación" onClick={() => setMenuOpen(true)}><Menu size={21} /></button><span className="breadcrumb-parent">Espacio de trabajo</span><ChevronRight size={14} className="breadcrumb-parent" /><span>{titles[location.pathname] || 'Forma Studio'}</span></div>
          <div className="topbar-right"><span className="powered"><span className="status-dot" /> Motor Replicate</span>{session?.user ? <span className="avatar" title={session.user.name}>{session.user.name.slice(0, 1).toUpperCase()}</span> : <button className="header-login" onClick={() => setLoginOpen(true)}>Iniciar sesión <ArrowUpRight size={15} /></button>}</div>
        </header>
        <main className="main-content">
          {error && <div className="notice error" role="alert"><AlertCircle size={17} /><span>{error}</span><button onClick={refresh}>Reintentar</button></div>}
          <Routes>
            <Route path="/" element={<Studio />} />
            <Route path="/history" element={<Library />} />
            <Route path="/favorites" element={<Library favoritesOnly />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="*" element={<div className="empty-page"><h1>Página no encontrada</h1><Link to="/">Volver al estudio</Link></div>} />
          </Routes>
          <footer className="footer"><span><span className="mini-brand">f</span> Hecho para tu imaginación.</span><span>Tu idea. Tu creación. <Sparkles size={12} /></span></footer>
        </main>
      </div>
    </div>
    {loginOpen && <SignIn modal onClose={() => setLoginOpen(false)} />}
    {toast && <div className="toast" role="status"><Check size={17} /><span>{toast}</span><button className="icon-button" aria-label="Cerrar aviso" onClick={() => setToast('')}><X size={16} /></button></div>}
  </StudioContext.Provider>;
}

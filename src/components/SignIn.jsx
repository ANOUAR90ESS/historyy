import React, { useEffect, useRef } from 'react';
import { Sparkles, ShieldCheck, X, ArrowRight } from 'lucide-react';
import { useStudio } from '../context.jsx';

export function GoogleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.61 0-4.82-1.76-5.61-4.12H3.05v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.93A6 6 0 0 1 6.08 12c0-.67.12-1.32.31-1.93V7.48H3.05A10 10 0 0 0 2 12c0 1.61.39 3.14 1.05 4.52l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.95 5.48l3.34 2.59C7.18 7.71 9.39 5.95 12 5.95Z"/></svg>;
}
export default function SignIn({ modal = false, onClose }) {
  const { session, loading } = useStudio();
  const ref = useRef(null);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    ref.current?.focus();
    const trap = e => {
      if (e.key !== 'Tab') return;
      const nodes = ref.current?.querySelectorAll('button:not(:disabled), a[href]');
      if (!nodes?.length) { e.preventDefault(); return; }
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trap);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', trap); document.body.style.overflow = overflow; previous?.focus(); };
  }, [modal]);
  const content = <div className="signin-card" ref={ref} tabIndex={-1} role={modal ? 'dialog' : undefined} aria-modal={modal || undefined} aria-labelledby="signin-heading">
    {modal && <button className="icon-button modal-close" aria-label="Cerrar" onClick={onClose}><X size={20} /></button>}
    <div className="signin-art"><span className="signin-orbit" /><span className="signin-mark"><Sparkles size={31} /></span></div>
    <span className="eyebrow">TU ESPACIO CREATIVO</span><h2 id="signin-heading">Las grandes ideas<br />empiezan contigo.</h2><p>Inicia sesión para crear imágenes y vídeos, guardar tus favoritos y volver a tus ideas.</p>
    {session?.googleConfigured ? <><a className="google-button" href="/api/auth/google" target="_blank" rel="noopener noreferrer"><GoogleIcon /> Continuar con Google <ArrowRight size={17} /></a><p className="setup-note">Google se abrirá en una nueva pestaña. Al volver, tu sesión se actualizará.</p></> : <><button className="google-button" disabled><GoogleIcon /> {loading ? 'Preparando el acceso…' : 'Continuar con Google'}</button><p className="setup-note">El acceso estará disponible al configurar las credenciales de Google. No necesitas compartir tu contraseña.</p></>}
    <span className="signin-privacy"><ShieldCheck size={14} /> Tus creaciones son privadas.</span>
  </div>;
  return modal ? <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>{content}</div> : <div className="protected-page">{content}</div>;
}

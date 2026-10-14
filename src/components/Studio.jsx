import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Image, Video, ArrowUpRight, ArrowRight, WandSparkles, Sparkles, SlidersHorizontal, ChevronDown, MoveUpRight, Zap, Plus, Aperture, RectangleHorizontal, LoaderCircle } from 'lucide-react';
import { api, useStudio } from '../context.jsx';
import GenerationCard from './GenerationCard.jsx';

const ideas = [
  { title: 'Fuera de este mundo', category: 'PAISAJES', image: 'photo-1464822759023-fed622ff2c3b', prompt: 'Una montaña monumental al amanecer, niebla suave entre los picos, luz cálida, fotografía cinematográfica, tonos lavanda y melocotón.' },
  { title: 'Menos, pero mejor', category: 'ARQUITECTURA', image: 'photo-1600210492486-724fe5c67fb0', prompt: 'Un interior minimalista mediterráneo con un sofá curvo, paredes de estuco blanco, luz de la tarde y sombras suaves, fotografía editorial de arquitectura.' },
  { title: 'La belleza del detalle', category: 'NATURALEZA', image: 'photo-1518531933037-91b2f5f229cc', prompt: 'Estudio botánico de hojas tropicales, luz natural difusa, verdes profundos, gotas de rocío, fotografía macro con detalle extraordinario.' },
];
export default function Studio() {
  const { session, generations, signIn, refresh, notify } = useStudio();
  const [type, setType] = useState('image');
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState('1:1');
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const selected = generations.find(row => row.id === selectedId) || generations[0];
  const cost = type === 'image' ? 1 : 10;
  async function generate(e) {
    e.preventDefault();
    if (!session?.user) return signIn();
    if (prompt.trim().length < 3) return notify('Describe tu idea con al menos 3 caracteres.');
    setBusy(true);
    try {
      const result = await api('/generations', { method: 'POST', body: JSON.stringify({ type, prompt, aspectRatio: ratio }) });
      setSelectedId(result.generation.id);
      await refresh();
      notify('Tu idea ya está tomando forma. Puedes seguir explorando.');
    } catch (error) { notify(error.message); }
    finally { setBusy(false); }
  }
  function useIdea(idea) {
    setPrompt(idea.prompt);
    document.getElementById('prompt')?.focus();
    document.getElementById('creation-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return <>
    <section className="studio-heading"><div><div className="eyebrow"><span className="tiny-star">✦</span> IMAGINA. CREA. REPITE.</div><h1>De tu imaginación<br className="mobile-br" /> <span>a la realidad.</span></h1><p>Convierte una idea en algo extraordinario. Tú pones la imaginación.</p></div><span className="heading-note"><span>Un lienzo.<br />Infinitas posibilidades.</span><MoveUpRight size={33} strokeWidth={1} /></span></section>
    <section className="creation-grid" aria-label="Generador creativo">
      <form id="creation-panel" className="creation-panel" onSubmit={generate}>
        <div className="panel-title"><div><span className="small-icon"><WandSparkles size={17} /></span><h2>Vamos a crear</h2></div><span className="step-label">01 / TU IDEA</span></div>
        <div className="type-tabs" role="tablist" aria-label="Tipo de creación"><button type="button" role="tab" aria-selected={type === 'image'} className={type === 'image' ? 'selected' : ''} onClick={() => setType('image')}><Image size={17} /> Imagen</button><button type="button" role="tab" aria-selected={type === 'video'} className={type === 'video' ? 'selected' : ''} onClick={() => setType('video')}><Video size={18} /> Vídeo <span className="beta-label">BETA</span></button></div>
        <div className="prompt-label"><label htmlFor="prompt">Describe tu idea</label><button type="button" className="text-button" onClick={() => setPrompt(ideas[Math.floor(Math.random() * ideas.length)].prompt)}><Sparkles size={13} /> Sorpréndeme</button></div>
        <div className="prompt-wrap"><textarea id="prompt" maxLength={2000} placeholder={type === 'image' ? 'Una pequeña casa junto a un lago, rodeada de montañas, con la luz cálida del amanecer…' : 'Una cámara avanza suavemente entre montañas cubiertas de niebla al amanecer…'} value={prompt} onChange={e => setPrompt(e.target.value)} /><div className="prompt-bottom"><span>Los detalles marcan la diferencia.</span><span>{prompt.length}/2000</span></div></div>
        <div className="generation-settings"><div className="setting"><label htmlFor="model"><Aperture size={13} /> Modelo</label><div className="model-field" id="model"><span className="model-symbol">✳</span>{type === 'image' ? 'FLUX Schnell' : 'MiniMax Video-01'}<span className="model-tag">{type === 'image' ? 'Rápido' : 'Vídeo'}</span></div></div><div className="setting"><label htmlFor="ratio"><RectangleHorizontal size={13} /> Formato</label><div className="select-wrap"><select id="ratio" value={type === 'video' ? '16:9' : ratio} onChange={e => setRatio(e.target.value)} disabled={type === 'video'}>{['1:1','16:9','9:16','4:3','3:4'].map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={13} /></div></div></div>
        {session?.user && !session.replicateConfigured && <div className="integration-note">Configura la clave de Replicate para generar contenido.</div>}
        <button className="generate-button" disabled={busy || (session?.user && (!session.replicateConfigured || session.user.credits < cost))} type="submit">{busy ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}<span>{busy ? 'Preparando tu creación…' : `Generar ${type === 'image' ? 'imagen' : 'vídeo'}`}</span><ArrowRight size={18} /></button>
        <div className="generation-footnote"><span><Zap size={12} /> {cost} {cost === 1 ? 'crédito' : 'créditos'} por creación</span><span>{session?.user ? `${session.user.credits} disponibles` : 'Inicia sesión para crear'}</span></div>
      </form>
      <div className={`result-panel ${selected ? 'has-result' : ''}`}>
        <div className="result-header"><span><span className="live-dot" /> TU LIENZO</span><span>{selected ? 'Tu última creación' : 'La magia ocurre aquí'}</span></div>
        {selected ? <GenerationCard generation={selected} featured /> : <div className="blank-canvas"><div className="canvas-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-tile tile-back"><Video size={30} strokeWidth={1.3}/></div><div className="art-tile tile-front"><Image size={40} strokeWidth={1.2}/><span className="art-shine">✦</span></div><span className="art-dot dot-one"/><span className="art-dot dot-two"/><span className="canvas-star">✧</span></div><h3>Todo empieza con una idea.</h3><p>Describe lo que imaginas y dale al botón.<br />Nosotros nos encargamos del resto.</p><span className="canvas-label"><Sparkles size={12} /> CREADO POR TI. POTENCIADO POR IA.</span></div>}
        <div className="canvas-bottom"><span><span className="keyboard-key">✦</span> Tu próximo «wow» está a un prompt de distancia.</span><Plus size={14} /></div>
      </div>
    </section>
    <section className="inspiration-section"><div className="section-heading"><div><div className="section-title"><h2>Un poco de inspiración</h2><span className="handdrawn-star">✳</span></div><p>Grandes ideas que empiezan con unas pocas palabras.</p></div><span className="inspiration-note">EL PUNTO DE PARTIDA LO ELIGES TÚ <ArrowUpRight size={14} /></span></div>
      <div className="inspiration-grid">{ideas.map((idea, index) => <button className={`inspiration-card inspiration-${index}`} key={idea.title} onClick={() => useIdea(idea)} aria-label={`Usar idea: ${idea.title}`}><img src={`https://images.unsplash.com/${idea.image}?auto=format&fit=crop&w=900&q=85`} alt={['Montañas entre niebla y luz del amanecer','Interior cálido de inspiración mediterránea','Detalle de hojas tropicales verdes'][index]} loading="lazy"/><span className="inspiration-badge">{idea.category}</span><div className="inspiration-caption"><div><h3>{idea.title}</h3><span>Explorar este prompt</span></div><span className="circle-arrow"><ArrowUpRight size={19}/></span></div></button>)}</div><p className="image-disclaimer">Fotografías de referencia · Unsplash. Úsalas como punto de partida para tus propias creaciones.</p>
    </section>
    {session?.user && generations.length > 0 && <section className="recent-section"><div className="section-heading"><div><h2>Hecho por ti</h2><p>Tus ideas más recientes, en un solo lugar.</p></div><Link to="/history" className="text-button">Ver biblioteca <ArrowRight size={15}/></Link></div><div className="media-grid">{generations.slice(0, 3).map(row => <GenerationCard key={row.id} generation={row}/>)}</div></section>}
  </>;
}

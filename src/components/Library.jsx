import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, Grid2X2, ArrowRight } from 'lucide-react';
import { useStudio } from '../context.jsx';
import SignIn from './SignIn.jsx';
import GenerationCard from './GenerationCard.jsx';
export default function Library({ favoritesOnly = false }) {
  const { session, generations, loading } = useStudio();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  if (loading) return <div className="loading-page">Preparando tu espacio…</div>;
  if (!session?.user) return <SignIn />;
  const rows = generations.filter(row => (!favoritesOnly || row.favorite) && (filter === 'all' || row.type === filter) && row.prompt.toLowerCase().includes(search.toLowerCase()));
  return <section className="library-page"><div className="page-heading"><span className="eyebrow">TU UNIVERSO CREATIVO</span><h1>{favoritesOnly ? 'Tus favoritos.' : 'Hecho por ti.'}</h1><p>{favoritesOnly ? 'Las ideas a las que siempre quieres volver.' : 'Cada idea tiene su lugar. Encuentra aquí todas tus creaciones.'}</p></div><div className="library-toolbar"><div className="filter-tabs" aria-label="Filtrar creaciones">{[['all','Todo'],['image','Imágenes'],['video','Vídeos']].map(([value,label]) => <button key={value} className={filter === value ? 'selected' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div><div className="search-field"><Search size={16}/><input aria-label="Buscar creaciones" placeholder="Buscar una idea…" value={search} onChange={e => setSearch(e.target.value)}/></div></div><span className="result-count">{rows.length} {rows.length === 1 ? 'creación' : 'creaciones'}</span>{rows.length ? <div className="media-grid">{rows.map(row => <GenerationCard generation={row} key={row.id}/>)}</div> : <div className="empty-page">{favoritesOnly ? <Heart size={34}/> : <Grid2X2 size={34}/>}<h2>{search || filter !== 'all' ? 'No encontramos creaciones' : favoritesOnly ? 'Las mejores ideas se quedan.' : 'Aquí empieza tu colección.'}</h2><p>{search || filter !== 'all' ? 'Prueba con otra búsqueda o cambia el filtro.' : favoritesOnly ? 'Toca el corazón de una creación para guardarla aquí.' : 'Tu primera creación está a una idea de distancia.'}</p><Link className="primary-link" to="/">Ir al estudio <ArrowRight size={16}/></Link></div>}</section>;
}

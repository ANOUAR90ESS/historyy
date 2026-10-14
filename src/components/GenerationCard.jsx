import React from 'react';
import { Heart, Download, LoaderCircle, AlertCircle, Image, Video } from 'lucide-react';
import { useStudio } from '../context.jsx';
const statusLabels = { starting: 'Preparando tu idea…', processing: 'Tu idea está tomando forma…', failed: 'No se pudo completar' };
export default function GenerationCard({ generation, featured = false }) {
  const { favorite } = useStudio();
  const pending = ['starting', 'processing'].includes(generation.status);
  return <article className={`generation-card ${featured ? 'featured' : ''}`}>
    <div className="generation-media">{generation.mediaUrl ? (generation.type === 'video' ? <video src={generation.mediaUrl} controls playsInline preload="metadata" /> : <img src={generation.mediaUrl} alt={generation.prompt} loading="lazy" />) : <div className={`generation-state ${generation.status === 'failed' ? 'failed' : ''}`}>{pending ? <LoaderCircle size={30} className="spin" /> : <AlertCircle size={30}/>}<strong>{statusLabels[generation.status]}</strong><p>{pending ? 'Puede tardar unos minutos. Tu creación se guardará en la biblioteca.' : generation.error}</p></div>}</div>
    <div className="generation-details"><span className="generation-type">{generation.type === 'image' ? <Image size={12} /> : <Video size={12}/>} {generation.type === 'image' ? 'Imagen' : 'Vídeo'} <span>· {new Date(generation.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span></span><p title={generation.prompt}>{generation.prompt}</p><div className="generation-actions"><span>{generation.refunded ? 'Créditos devueltos' : `${generation.cost} ${generation.cost === 1 ? 'crédito' : 'créditos'}`}</span><button className={`icon-button favorite-button ${generation.favorite ? 'is-favorite' : ''}`} aria-label={generation.favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'} aria-pressed={generation.favorite} onClick={() => favorite(generation)}><Heart size={17} fill={generation.favorite ? 'currentColor' : 'none'}/></button>{generation.mediaUrl && <a className="icon-button" href={generation.mediaUrl} download={`forma-${generation.id}`} aria-label="Descargar creación"><Download size={17}/></a>}</div></div>
  </article>;
}

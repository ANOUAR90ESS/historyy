import { createContext, useContext } from 'react';
export const StudioContext = createContext(null);
export const useStudio = () => useContext(StudioContext);
export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin', ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo conectar. Inténtalo de nuevo.');
  return data;
}

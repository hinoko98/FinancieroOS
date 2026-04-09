'use client';

import { useEffect, useState } from 'react';

const reflections = [
  'Seneca recordaba que no es pobre quien tiene poco, sino quien siempre quiere mas.',
  'Aristoteles defendia la prudencia: gastar bien tambien es una forma de virtud.',
  'Epicteto insistia en cuidar lo que depende de nosotros, y las finanzas empiezan ahi.',
  'Confucio veia el orden cotidiano como la base de una vida estable y digna.',
  'Marco Aurelio sugeria revisar cada dia lo esencial; un buen cierre financiero hace justo eso.',
  'Para Platon, una ciudad justa necesitaba equilibrio; una casa tambien.',
  'Heraclito diria que todo cambia, por eso conviene mirar el flujo del dinero con calma.',
  'Simone Weil ensenaba a prestar atencion; el control financiero es atencion aplicada.',
  'Montaigne desconfiaba del exceso: vivir mejor no siempre significa gastar mas.',
  'Descartes valoraba el metodo; un buen sistema reduce dudas y errores.',
  'Spinoza proponia entender antes de reaccionar; los numeros ayudan a decidir sin impulso.',
  'Hannah Arendt recordaba que administrar bien la casa sostiene la vida comun.',
  'Ortega y Gasset diria que somos tambien nuestras circunstancias, incluidas las economicas.',
  'Byung-Chul Han advertiria que correr sin pausa agota; planear libera espacio mental.',
  'Nietzsche hablaba de estilo en la vida; ordenar el dinero tambien es una forma de estilo.',
  'Albert Camus encontraba dignidad en lo cotidiano; pagar a tiempo tambien sostiene la calma.',
  'Zygmunt Bauman vio un mundo liquido; por eso conviene dar estructura a lo inestable.',
  'Maria Zambrano unia razon y vida; el presupuesto sirve cuando conversa con la realidad.',
  'Ralph Emerson confiaba en la disciplina serena, mas util que la urgencia constante.',
  'Ciceron defendia la templanza: saber apartar hoy protege la tranquilidad de manana.',
];

const ROTATION_MS = 90_000;

export function LoginHero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % reflections.length);
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-xl uppercase tracking-[0.40em] text-[#f3dcc6]/80">
        Finance OS
      </p>
      <h1 className="text-5xl font-bold tracking-tight">Control financiero</h1>
      <p className="max-w-xl text-base leading-8 text-[#f8e8d7]/80 transition-opacity duration-500">
        {reflections[index]}
      </p>
    </div>
  );
}

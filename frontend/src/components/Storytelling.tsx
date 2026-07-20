import React from 'react';
import StorySection, { StoryChapter } from './StorySection';
import { useT } from '../i18n/LanguageContext';

/**
 * Storytelling do processo logístico (sem cidades específicas).
 * A cena 3D de fundo é a OBJECTO SPLINE global (cena em SplineScene),
 * que reage a este progresso. O texto faz crossfade scroll-driven +
 * profundidade parallax, numa experiência visual de narrativa contínua.
 * As chapters aparecem em sítios diferentes: esquerda -> centro -> direita -> centro.
 */
export default function Storytelling() {
  const { t } = useT();

  const chapters: StoryChapter[] = [
    {
      id: 'recolha',
      kicker: t('story.ch1.kicker'),
      tone: 'gold',
      align: 'left',
      title: t('story.ch1.title'),
      body: t('story.ch1.body'),
    },
    {
      id: 'transito',
      kicker: t('story.ch2.kicker'),
      tone: 'lilac',
      align: 'center',
      title: t('story.ch2.title'),
      body: t('story.ch2.body'),
    },
    {
      id: 'escritorio',
      kicker: t('story.ch3.kicker'),
      tone: 'gold',
      align: 'right',
      title: t('story.ch3.title'),
      body: t('story.ch3.body'),
    },
    {
      id: 'entrega',
      kicker: t('story.ch4.kicker'),
      tone: 'white',
      align: 'center',
      title: t('story.ch4.title'),
      body: t('story.ch4.body'),
    },
  ];

  return (
    <StorySection
      chapters={chapters}
      onProgress={(p) => {
        window.dispatchEvent(new CustomEvent('storytelling:progress', { detail: p }));
      }}
    />
  );
}

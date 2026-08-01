import React from 'react';
import StorySection, { StoryChapter } from './StorySection';
import { useT } from '../i18n/LanguageContext';

export default function Storytelling() {
  const { t } = useT();

  const chapters: StoryChapter[] = [
    {
      id: 'recolha',
      tone: 'gold',
      align: 'left',
      title: t('story.ch1.title'),
      body: t('story.ch1.body'),
    },
    {
      id: 'transito',
      tone: 'lilac',
      align: 'center',
      title: t('story.ch2.title'),
      body: t('story.ch2.body'),
    },
    {
      id: 'escritorio',
      tone: 'gold',
      align: 'right',
      title: t('story.ch3.title'),
      body: t('story.ch3.body'),
    },
    {
      id: 'entrega',
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





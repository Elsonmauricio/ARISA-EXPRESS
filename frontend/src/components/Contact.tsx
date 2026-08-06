// src/components/Contact.tsx
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GoldButton } from './Button';
import { motion, AnimatePresence } from 'framer-motion';
import SectionHeading from './SectionHeading';
import { useT } from '../i18n/LanguageContext';
import { api } from '../lib/api';
import { whatsappUrl } from '../lib/utils';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { Mailbox3D } from './three/Mailbox3D';

export default function Contact() {
  const { t } = useT();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(api('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await response.json();

      if (json.success) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => setStatus('idle'), 5001);
      } else {
        throw new Error(json.error || t('contact.erroEnvio'));
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || t('contact.erroInesperado'));
    }
  };
  return (
    <section id="contactos" className="py-20 px-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#E8D9F5]/0 via-transparent to-[#E8D9F5]/10 z-[1]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#E8D9F5]/0 via-transparent to-[#E8D9F5]/20 z-[1]" />
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          align="center"
          eyebrow={t('contact.eyebrow')}
          title={<span className="text-gradient-lilac">{t('contact.title')}</span>}
          subtitle={t('contact.subtitle')}
        />

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="glass-strong border-gradient p-6 md:p-8 rounded-3xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder={t('contact.nome')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 bg-[#E8D9F5] border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-800"
              />
              <input
                type="email"
                placeholder={t('contact.email')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 bg-[#E8D9F5] border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-800"
              />
              <input
                type="tel"
                placeholder={t('contact.telefone')}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-[#E8D9F5] border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-800"
              />
              <textarea
                rows={4}
                placeholder={t('contact.mensagem')}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                className="w-full px-4 py-3 bg-[#E8D9F5] border border-gray-300 rounded-lg focus:outline-none focus:border-gold resize-none text-gray-800"
              />

              <GoldButton type="submit" className="w-full py-3 flex items-center justify-center text-black gap-2" disabled={status === 'loading'}>
                <Send size={18} /> {status === 'loading' ? t('contact.enviando') : t('contact.enviar')}
              </GoldButton>

              <AnimatePresence>
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-green-400 text-sm justify-center mt-4"
                  >
                    <CheckCircle2 size={16} /> {t('contact.sucesso')}
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-400 text-sm justify-center mt-4"
                  >
                    <AlertCircle size={16} /> {errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>

               {/* Figura 3D Canvas */}
                    <div className="w-full h-40 sm:h-48 mt-4">
                      <Canvas camera={{ position: [0, 0, 4], fov: 40 }}>
                        <ambientLight intensity={0.8} />
                        <pointLight position={[10, 10, 10]} intensity={1} />
                        
                          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                            <Mailbox3D />
                          </Float>
                        
                        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
                      </Canvas>
                    </div>
            </form>      

          </div>

          <div className="space-y-4">
            <div className="glass-strong border-gradient p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-4">{t('contact.infoTitle')}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-black" />
                  <span>+351 934 292 082</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-black" />
                  <span>+244 948 440 920</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-black" />
                  <span>arisaexpress7@gmail.com</span>
                </div>
              </div>
            </div>

            {/* HorÃ¡rios */}
            <div className="glass-strong border-gradient p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock size={18} className="text-black" /> {t('contact.horario')}
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex items-center gap-2 text-black font-medium">
                        {t('contact.portugal')}
                  </div>
                   <p className="text-gray-800 mt-1">
                     {t('contact.horarioPT')}
                   </p>
                 </div>
                 <div>
                   <div className="flex items-center gap-2 text-black font-medium">
                        {t('contact.angola')}
                   </div>
                   <p className="text-gray-800 mt-1">
                     {t('contact.horarioAO')}
                   </p>
                 </div>
              </div>
            </div>

            {/* Moradas */}
            <div className="glass-strong border-gradient p-6 rounded-3xl">
               <h3 className="text-xl font-bold mb-4">{t('contact.moradas')}</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-black font-medium text-sm">
                    <MapPin size={16} /> {t('contact.luanda')}
                  </div>
                   <p className="text-sm text-gray-800 mt-1">
                     {t('contact.moradaLuanda1')}<br />
                     {t('contact.moradaLuanda2')}
                   </p>
                 </div>
                 <div>
                   <div className="flex items-center gap-2 text-black font-medium text-black">
                     <MapPin size={16} /> {t('contact.lisboa')}
                   </div>
                   <p className="text-black text-gray-800 mt-1">
                     {t('contact.moradaLisboa1')}<br />
                     {t('contact.moradaLisboa2')}
                   </p>
                 </div>
              </div>
            </div>

            <div className="glass-strong border-gradient p-6 text-center rounded-3xl">
              <h3 className="font-bold mb-2">{t('contact.whatsappTitle')}</h3>
              <a
                href={whatsappUrl(t('contact.whatsapp'))}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-green-600 text-black w-full py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                {t('contact.whatsapp')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}




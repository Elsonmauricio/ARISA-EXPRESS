// src/components/Contact.tsx
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GoldButton } from './Button';
import { motion, AnimatePresence } from 'framer-motion';
import SectionHeading from './SectionHeading.jsx';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await response.json();

      if (json.success) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        throw new Error(json.error || 'Erro ao enviar mensagem');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Ocorreu um erro inesperado.');
    }
  };

  return (
    <section id="contactos" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <SectionHeading
          align="center"
          eyebrow="Contactos"
          title="Vamos conversar"
          subtitle="Tem alguma dúvida ou precisa de um serviço personalizado? A nossa equipa está pronta para ajudar."
        />

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="glass-strong border-gradient p-6 md:p-8 rounded-3xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Nome completo" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-3 bg-white/5 border border-gold/30 rounded-lg focus:outline-none focus:border-gold" />
              <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full px-4 py-3 bg-white/5 border border-gold/30 rounded-lg focus:outline-none focus:border-gold" />
              <input type="tel" placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-gold/30 rounded-lg focus:outline-none focus:border-gold" />
              <textarea rows={4} placeholder="Mensagem" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required className="w-full px-4 py-3 bg-white/5 border border-gold/30 rounded-lg focus:outline-none focus:border-gold resize-none" />
              
              <GoldButton type="submit" className="w-full py-3 flex items-center justify-center gap-2" disabled={status === 'loading'}>
                <Send size={18} /> {status === 'loading' ? 'Enviando...' : 'Enviar Mensagem'}
              </GoldButton>

              <AnimatePresence>
                {status === 'success' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-green-400 text-sm justify-center mt-4">
                    <CheckCircle2 size={16} /> Mensagem enviada com sucesso!
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-400 text-sm justify-center mt-4">
                    <AlertCircle size={16} /> {errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          <div className="space-y-4">
            <div className="glass-strong border-gradient p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-4">Informações de Contacto</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3"><Phone size={18} className="text-gold" /><span>+351 934 292 082</span></div>
                <div className="flex items-center gap-3"><Mail size={18} className="text-gold" /><span>arisaexpress7@gmail.com</span></div>
                <div className="flex items-center gap-3"><MapPin size={18} className="text-gold" /><span>Luanda, Angola | Lisboa, Portugal</span></div>
                <div className="flex items-center gap-3"><Clock size={18} className="text-gold" /><span>Segunda a Sexta: 9h - 18h</span></div>
              </div>
            </div>
            <div className="glass-strong border-gradient p-6 text-center rounded-3xl">
              <h3 className="font-bold mb-2">Atendimento via WhatsApp</h3>
              <button className="bg-green-600 text-white w-full py-3 rounded-xl font-semibold hover:opacity-90">WhatsApp</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
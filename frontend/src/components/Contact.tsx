// src/components/Contact.tsx
import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';

export function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Mensagem enviada! Entraremos em contacto em breve.');
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <section id="contactos" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <span className="text-gold uppercase tracking-wider text-sm font-semibold">Contactos</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">Vamos conversar</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-card p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Nome completo" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-3 bg-white/5 border border-gold/30 rounded-lg focus:outline-none focus:border-gold" />
              <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full px-4 py-3 bg-white/5 border border-gold/30 rounded-lg focus:outline-none focus:border-gold" />
              <input type="tel" placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-gold/30 rounded-lg focus:outline-none focus:border-gold" />
              <textarea rows={4} placeholder="Mensagem" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required className="w-full px-4 py-3 bg-white/5 border border-gold/30 rounded-lg focus:outline-none focus:border-gold resize-none" />
              <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                <Send size={18} /> Enviar Mensagem
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">Informações de Contacto</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3"><Phone size={18} className="text-gold" /><span>+244 923 456 789</span></div>
                <div className="flex items-center gap-3"><Mail size={18} className="text-gold" /><span>info@arisaexpress.com</span></div>
                <div className="flex items-center gap-3"><MapPin size={18} className="text-gold" /><span>Luanda, Angola | Lisboa, Portugal</span></div>
                <div className="flex items-center gap-3"><Clock size={18} className="text-gold" /><span>Segunda a Sexta: 8h - 18h</span></div>
              </div>
            </div>
            <div className="glass-card p-6 text-center">
              <h3 className="font-bold mb-2">Atendimento via WhatsApp</h3>
              <button className="bg-green-600 text-white w-full py-3 rounded-xl font-semibold hover:opacity-90">WhatsApp</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
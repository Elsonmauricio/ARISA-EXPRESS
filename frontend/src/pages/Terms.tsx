// src/pages/Terms.tsx
import Layout from '../components/Layout';

export default function Terms() {
  return (
    <Layout>
      <div className="min-h-screen bg-black pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-8">
            <span className="text-gradient-gold">Termos & Condições</span>
          </h1>
          <div className="glass-strong border-gradient p-8 rounded-2xl text-white/80 space-y-6">
            <p className="text-sm text-white/60">Última atualização: {new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}</p>

            <h2 className="text-xl font-semibold text-white">1. Identificação da Empresa</h2>
            <p>
              <strong>Arisa Expresso - Prestação de Serviços, (SU), Lda</strong><br />
              NIF: 5001854984<br />
              Morada: Província de Luanda, Município de Talatona, Distrito Urbano de Camama, Condomínio Vila Flor, Rua 3, casa n.º 19<br />
              Contacto: arisaexpress7@gmail.com | +351 934 292 082 | +244 948 440 920
            </p>

            <h2 className="text-xl font-semibold text-white">2. Serviços Prestados</h2>
            <p>A Arisa Express oferece os seguintes serviços:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Transporte de mercadorias entre Portugal e Angola</li>
              <li>Redirecionamento de encomendas</li>
              <li>Compras personalizadas</li>
            </ul>

            <h2 className="text-xl font-semibold text-white">3. Condições de Pagamento</h2>
            <p>Os pagamentos podem ser efetuados através de:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Transferência bancária</li>
              <li>MBWay</li>
              <li>Depósito</li>
              <li>Cash (presencial)</li>
            </ul>

            <h2 className="text-xl font-semibold text-white">4. Cancelamentos</h2>
            <p>O cliente pode cancelar a sua encomenda até às <strong>16h do dia de envio</strong>, sem qualquer custo adicional.</p>

            <h2 className="text-xl font-semibold text-white">5. Prazos de Entrega</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>3 a 5 dias úteis</strong> – para mercadoria sem teor alfandegário.</li>
              <li><strong>Até 10 dias úteis</strong> – para mercadoria com teor alfandegário.</li>
            </ul>
            <p className="text-sm text-white/60">* Os prazos contam a partir da data de envio.</p>

            <h2 className="text-xl font-semibold text-white">6. Responsabilidades da Empresa</h2>
            <p>A Arisa Express não se responsabiliza por:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Mercadoria que já tenha sido recebida danificada ou em mau estado.</li>
              <li>Mercadoria não declarada para envio.</li>
              <li>Mercadorias abandonadas nas instalações por mais de 1 mês.</li>
              <li>Bens alimentares mal conservados ou com prazo de validade dentro dos prazos para disponibilização de levantamento.</li>
            </ul>

            <h2 className="text-xl font-semibold text-white">7. Disposições Gerais</h2>
            <p>A Arisa Express reserva-se o direito de atualizar estes Termos & Condições a qualquer momento. A versão em vigor é a publicada no site.</p>
            <p>Para qualquer questão, contacte-nos através dos meios indicados no ponto 1.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
// src/pages/Privacy.tsx
import Layout from '../components/Layout';

export default function Privacy() {
  return (
    <Layout>
      <div className="min-h-screen bg-black pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-8">
            <span className="text-gradient-gold">Política de Privacidade</span>
          </h1>
          <div className="glass-strong border-gradient p-8 rounded-2xl text-white/80 space-y-6">
            <p className="text-sm text-white/60">Última atualização: {new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}</p>

            <h2 className="text-xl font-semibold text-white">1. Responsável pelo Tratamento</h2>
            <p>
              <strong>Arisa Expresso - Prestação de Serviços, (SU), Lda</strong><br />
              NIF: 5001854984<br />
              Morada: Província de Luanda, Município de Talatona, Distrito Urbano de Camama, Condomínio Vila Flor, Rua 3, casa n.º 19<br />
              Contacto: arisaexpress7@gmail.com | +351 934 292 082 | +244 948 440 920
            </p>

            <h2 className="text-xl font-semibold text-white">2. Dados Recolhidos</h2>
            <p>Para a prestação dos nossos serviços, recolhemos os seguintes dados pessoais:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nome completo</li>
              <li>Endereço de email</li>
              <li>Número de telefone</li>
              <li>Morada de entrega</li>
              <li>Dados da encomenda (conteúdo, peso, valor)</li>
              <li>Dados de pagamento (apenas para processamento da transação)</li>
            </ul>

            <h2 className="text-xl font-semibold text-white">3. Finalidade do Tratamento</h2>
            <p>Os dados são utilizados exclusivamente para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Processar e gerir encomendas</li>
              <li>Comunicação com o cliente sobre o estado da encomenda</li>
              <li>Cumprimento de obrigações legais e fiscais</li>
              <li>Melhoria dos serviços prestados</li>
            </ul>

            <h2 className="text-xl font-semibold text-white">4. Partilha de Dados</h2>
            <p>
              <strong>Os dados pessoais dos clientes não são partilhados com terceiros.</strong><br />
              Apenas são divulgados quando exigido por lei ou para cumprimento de obrigações contratuais (ex: transportadoras, autoridades alfandegárias).
            </p>

            <h2 className="text-xl font-semibold text-white">5. Prazo de Conservação</h2>
            <p>Os dados são conservados pelo período necessário para a prestação do serviço e para cumprimento de obrigações legais, sendo posteriormente eliminados de forma segura.</p>

            <h2 className="text-xl font-semibold text-white">6. Direitos do Utilizador</h2>
            <p>O utilizador tem o direito a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Aceder aos seus dados pessoais</li>
              <li>Solicitar a retificação ou eliminação dos dados</li>
              <li>Opor-se ao tratamento dos seus dados</li>
              <li>Solicitar a portabilidade dos dados</li>
            </ul>
            <p>Para exercer estes direitos, contacte-nos através dos meios indicados no ponto 1.</p>

            <h2 className="text-xl font-semibold text-white">7. Segurança</h2>
            <p>A Arisa Express adota medidas técnicas e organizacionais adequadas para proteger os dados pessoais contra acesso não autorizado, perda ou destruição.</p>

            <h2 className="text-xl font-semibold text-white">8. Cookies</h2>
            <p>O site utiliza cookies para melhorar a experiência de navegação e para fins analíticos. O utilizador pode gerir as suas preferências de cookies através das configurações do navegador.</p>

            <h2 className="text-xl font-semibold text-white">9. Alterações à Política</h2>
            <p>A Arisa Express reserva-se o direito de atualizar esta Política de Privacidade. A versão em vigor é a publicada no site.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
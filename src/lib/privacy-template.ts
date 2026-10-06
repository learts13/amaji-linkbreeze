/**
 * Modelo automático de política de privacidade para páginas do LinkBreeze.
 * Gera o conteúdo conforme os recursos habilitados na página quando não há
 * uma política personalizada. Tradução do modelo original para pt-BR.
 */

export interface PrivacyTemplateInput {
  /** Nome exibido na página */
  displayName: string;
  /** Identificador público da página */
  slug: string;
  /** Se as estatísticas integradas estão ativas */
  hasAnalytics: boolean;
  /** Se a coleta de e-mails está habilitada */
  hasEmailCapture: boolean;
  /** Se há conteúdo incorporado, como YouTube ou Spotify */
  hasEmbeds: boolean;
  /** Se há um script externo de análise configurado */
  hasExternalAnalytics: boolean;
  /** Retenção das estatísticas em dias; 0 indica prazo indeterminado */
  analyticsRetentionDays: number;
  /** E-mail de contato para questões de privacidade */
  contactEmail?: string;
}

export function generatePrivacyPolicy(input: PrivacyTemplateInput): string {
  const name = input.displayName || "Este site";
  const contactLine = input.contactEmail
    ? `Contato: ${input.contactEmail}`
    : `Contato: Consulte os links da página.`;
  const retentionText =
    input.analyticsRetentionDays > 0
      ? `por ${input.analyticsRetentionDays} dias`
      : "até que sejam excluídos manualmente";

  const sections: string[] = [];

  sections.push(
    `# Política de Privacidade de ${name}`,
    ``,
    `*Última atualização: ${new Date().toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}*`,
    ``,
    `Esta política de privacidade explica quais informações são coletadas quando você visita esta página e como elas são utilizadas.`,
    ``,
  );

  // Estatísticas integradas
  if (input.hasAnalytics) {
    sections.push(
      `## Estatísticas de acesso`,
      ``,
      `Esta página utiliza ferramentas de análise que respeitam a privacidade e não usam cookies. Os seguintes dados são coletados automaticamente durante sua visita:`,
      ``,
      `- **Visualizações da página e cliques** — contabilizados para medir o engajamento`,
      `- **Tipo de dispositivo** — classificado como celular, computador ou tablet`,
      `- **País aproximado** — identificado a partir do seu endereço IP`,
      `- **Site de origem da visita** — apenas a origem (por exemplo, instagram.com), sem a URL completa`,
      ``,
      `Seu endereço IP **nunca é armazenado**. Em vez disso, é calculado um hash unidirecional do seu endereço IP e do tipo de navegador, utilizando SHA-256 com um valor adicional de proteção (salt) que muda diariamente. Esse hash não pode ser revertido para recuperar seu endereço IP e muda a cada dia, portanto não pode ser utilizado para rastrear suas visitas em dias diferentes.`,
      ``,
      `Os dados estatísticos são mantidos ${retentionText}.`,
      ``,
    );
  }

  // Coleta de e-mails
  if (input.hasEmailCapture) {
    sections.push(
      `## Endereço de e-mail`,
      ``,
      `Se você optar por se inscrever com seu endereço de e-mail, ele será armazenado no banco de dados do site e poderá ser utilizado para enviar novidades ou boletins informativos. Seu e-mail nunca é vendido nem compartilhado com terceiros.`,
      ``,
      `Você pode solicitar a exclusão do seu e-mail a qualquer momento. ${contactLine}`,
      ``,
    );
  }

  // Ferramentas externas de análise
  if (input.hasExternalAnalytics) {
    sections.push(
      `## Ferramentas de análise de terceiros`,
      ``,
      `Esta página carrega um script de análise de terceiros. O provedor poderá coletar dados adicionais de acordo com sua própria política de privacidade, inclusive por meio de cookies. Consulte os termos do provedor para obter mais informações.`,
      ``,
    );
  }

  // Conteúdo incorporado
  if (input.hasEmbeds) {
    sections.push(
      `## Conteúdo incorporado`,
      ``,
      `Esta página contém conteúdo incorporado de plataformas de terceiros (como YouTube, Spotify, Vimeo, SoundCloud ou Bandcamp). Ao visualizar ou interagir com esse conteúdo, a plataforma poderá coletar dados de acordo com sua própria política de privacidade. O YouTube utiliza youtube-nocookie.com, que limita o rastreamento, mas não o impede completamente.`,
      ``,
    );
  }

  // Cookies
  sections.push(
    `## Cookies`,
    ``,
    `Esta página **não** utiliza cookies${
      input.hasExternalAnalytics ? " próprios" : ""
    }. Nenhum cookie de rastreamento${
      input.hasExternalAnalytics ? " próprio" : ""
    } é definido quando você visita esta página${
      input.hasExternalAnalytics
        ? ". Se houver um provedor de análise de terceiros configurado, ele poderá definir seus próprios cookies."
        : "."
    }`,
    ``,
  );

  // Direitos dos visitantes
  sections.push(
    `## Seus direitos`,
    ``,
    `Dependendo da sua localização (União Europeia/Espaço Econômico Europeu, Reino Unido, Califórnia etc.), você poderá ter o direito de:`,
    ``,
    `- Solicitar acesso aos dados mantidos sobre você`,
    `- Solicitar a exclusão dos seus dados`,
    `- Opor-se ao tratamento dos seus dados`,
    `- Retirar seu consentimento (quando aplicável)`,
    ``,
    `Como os dados estatísticos são pseudonimizados (seu IP é convertido em hash e nunca é armazenado), os registros individuais não podem ser vinculados a você.${
      input.hasEmailCapture
        ? " Pessoas inscritas por e-mail podem solicitar a exclusão a qualquer momento."
        : ""
    }`,
    ``,
    `${contactLine}`,
    ``,
  );

  // Responsável pelo tratamento dos dados
  sections.push(
    `## Controlador dos dados`,
    ``,
    `Esta página utiliza o LinkBreeze, uma ferramenta de página de links hospedada em servidor próprio. O proprietário da página é o controlador dos dados pessoais coletados aqui. Os desenvolvedores do LinkBreeze não têm acesso aos dados desta instalação.`,
    ``,
  );

  // Privacidade de crianças
  sections.push(
    `## Privacidade de crianças`,
    ``,
    `Esta página não é destinada a crianças menores de 13 anos (ou da idade aplicável na sua jurisdição). Não coletamos intencionalmente dados pessoais de crianças.`,
    ``,
  );

  // Alterações na política
  sections.push(
    `## Alterações nesta política`,
    ``,
    `Esta política de privacidade poderá ser atualizada periodicamente. A data de "Última atualização" no início desta página indica a revisão mais recente.`,
  );

  return sections.join("\n");
}

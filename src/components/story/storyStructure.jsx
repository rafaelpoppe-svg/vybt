/**
 * NOVA ESTRUTURA DE DADOS PARA STORIES
 * 
 * Este ficheiro documenta a nova estrutura de agrupamento de stories
 * implementada para suportar navegação por utilizador/plano.
 */

/**
 * @typedef {Object} StoryGroup
 * @property {string} type - "plan" | "friend" | "highlighted"
 * 
 * Para grupos de PLANO:
 * @property {string} plan_id - ID do plano
 * @property {string} planName - Nome do plano
 * @property {string} planCity - Cidade do plano
 * @property {string} planThemeColor - Cor do tema do plano
 * @property {string} planImage - Imagem de capa do plano
 * @property {Array} stories - Array de stories do plano
 * 
 * Para grupos de AMIGOS e HIGHLIGHTED:
 * @property {string} user_id - ID do utilizador
 * @property {string} userName - Nome do utilizador
 * @property {string} userPhoto - Foto de perfil do utilizador
 * @property {Array} stories - Array de stories do utilizador
 */

/**
 * ESTADOS DE MODERAÇÃO DE STORIES
 * 
 * pending: Story aguardando revisão por IA
 * approved: Story foi aprovado e pode ser visualizado
 * rejected: Story foi rejeitado pela IA
 */
export const MODERATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

/**
 * TIPOS DE VISIBILIDADE DE STORIES
 * 
 * friends: Apenas amigos veem o story
 * group_only: Apenas membros do grupo/plano veem
 * highlighted: Story promovido, aparece para todos no raio
 */
export const STORY_VISIBILITY = {
  FRIENDS: 'friends',
  GROUP_ONLY: 'group_only',
  HIGHLIGHTED: 'highlighted'
};

/**
 * TIPOS DE GRUPOS DE STORIES
 */
export const GROUP_TYPE = {
  PLAN: 'plan',
  FRIEND: 'friend',
  HIGHLIGHTED: 'highlighted'
};

/**
 * FLUXO DE CRIAÇÃO E PUBLICAÇÃO DE STORY
 * 
 * 1. Utilizador tira foto/vídeo (AddStory page)
 * 2. Navega para página de EDIÇÃO (novo component)
 * 3. Clica "Publicar" → Story é criado com moderation_status = "pending"
 * 4. Utilizador é redirecionado para Home
 * 5. Story aparece nas Experiences com estado "carregando"
 * 6. IA revisa o conteúdo (função backend)
 * 7. moderation_status é atualizado para "approved" ou "rejected"
 * 8. Story fica visível ou é ocultado conforme o resultado
 */

/**
 * LÓGICA DE EXIBIÇÃO NAS EXPERIENCES
 * 
 * Quando o utilizador abre a página Home:
 * 
 * 1. GRUPOS DE PLANOS:
 *    - Stories publicados PARA um plano (plan_id preenchido)
 *    - Aparecem com ícone e nome do PLANO
 *    - Vistos por TODOS no raio geográfico
 *    - Sequência: todos os stories dos utilizadores para esse plano
 * 
 * 2. GRUPOS DE AMIGOS:
 *    - Stories dos teus amigos (visibility = "friends")
 *    - Aparecem com ícone e nome do AMIGO
 *    - Vistos apenas por ti (e teus amigos veem o teu story)
 * 
 * 3. GRUPOS HIGHLIGHTED (Promovidos):
 *    - Stories de utilizadores que NÃO são amigos teus
 *    - Mas que foram "highlighted" pelo criador
 *    - Aparecem com ícone e nome do UTILIZADOR
 *    - Vistos por TODOS no raio geográfico
 */

/**
 * NAVEGAÇÃO NO STORYVIEW
 * 
 * TOQUES NA TELA:
 * - Lado direito: Próxima história do MESMO grupo
 * - Lado esquerdo: História anterior do MESMO grupo
 * - Quando atinge o fim do grupo: automaticamente próximo grupo
 * 
 * DESLIZE HORIZONTAL:
 * - Deslizar para esquerda: Próximo GRUPO
 * - Deslizar para direita: GRUPO anterior
 * - Reseta a história para a primeira do novo grupo
 */

export default {
  MODERATION_STATUS,
  STORY_VISIBILITY,
  GROUP_TYPE
};
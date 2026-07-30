do $$
declare
  uid uuid := (select id from auth.users order by created_at limit 1);
  did uuid;
  r record;
begin
  if uid is null then raise exception 'Nenhum usuário encontrado'; end if;

  delete from assuntos where user_id = uid;
  delete from disciplinas where user_id = uid;

  drop table if exists _e;
  create temp table _e(nome text, peso int, assuntos text[]) on commit drop;

  insert into _e values
  ('Língua Portuguesa', 2, array[
    'Compreensão e interpretação de texto; tipologia e gêneros textuais',
    'Semântica: significação, sinonímia/antonímia, figuras de linguagem',
    'Morfologia: estrutura e formação de palavras; ortografia; acentuação',
    'Classes de palavras variáveis e invariáveis',
    'Sintaxe: termos da oração; período simples e composto',
    'Concordância verbal e nominal',
    'Regência verbal e nominal; crase',
    'Colocação pronominal; funções do "que" e do "se"',
    'Reescrita de orações e parágrafos',
    'Pontuação e sua função no texto',
    'Coesão e coerência (referenciação, sequenciação)',
    'Redação Oficial (Manual da Presidência da República)',
    'Variação linguística: norma culta']),
  ('Raciocínio Lógico', 1, array[
    'Conjuntos numéricos: inteiros, racionais e reais',
    'Sistema legal de medidas',
    'Razões, proporções, divisão proporcional e regra de três',
    'Porcentagens',
    'Equações e inequações de 1º e 2º graus; sistemas lineares',
    'Funções e gráficos',
    'Progressões aritméticas e geométricas',
    'Estruturas lógicas e lógica de argumentação',
    'Lógica sentencial: proposições, tabelas-verdade, equivalências',
    'Leis de Morgan; diagramas lógicos',
    'Lógica de primeira ordem',
    'Princípios de contagem e probabilidade',
    'Operações com conjuntos',
    'Problemas aritméticos, geométricos e matriciais']),
  ('Atualidades', 1, array[
    'Conflitos geopolíticos e relações internacionais',
    'Direitos humanos, democracia e cidadania',
    'Desigualdades sociais; trabalho e economia',
    'Meio ambiente e mudanças climáticas',
    'Saúde pública e educação',
    'Violência e segurança pública',
    'Tecnologia da informação e cultura',
    'Problemas urbanos; atualidades da Bahia',
    'Comunicação: conceitos, efeitos e implicações']),
  ('Informática', 1, array[
    'Windows 11: fundamentos, janelas, barra de tarefas',
    'Pastas e arquivos; Windows Explorer; configurações básicas',
    'Word (Office 365): formatação, estilos, cabeçalhos, configuração',
    'Excel (Office 365): fórmulas, funções, formatação, gráficos',
    'PowerPoint (Office 365): apresentações, slides, integração',
    'Redes: internet, intranet, computação em nuvem',
    'Navegadores: Edge, Chrome e Firefox; Deep Web e Dark Web',
    'Correio eletrônico',
    'Segurança da informação: malware, antivírus, criptografia',
    'Backup e armazenamento em nuvem']),
  ('Promoção Igualdade Racial/Gênero', 2, array[
    'CF/88: arts. 1º, 3º, 4º e 5º',
    'Constituição da Bahia: Capítulo XXIII — Do Negro',
    'Lei 12.288/2010 — Estatuto da Igualdade Racial',
    'Lei 7.716/1989 — Crimes de preconceito de raça ou cor',
    'Decreto 65.810/1969 — Convenção eliminação discriminação racial',
    'Decreto 4.377/2002 — Convenção eliminação discriminação contra a mulher',
    'Lei 11.340/2006 — Lei Maria da Penha',
    'Código Penal art. 140 (injúria)',
    'Lei 9.455/1997 — Crimes de Tortura',
    'Lei 2.889/1956 — Crime de Genocídio',
    'Lei 7.437/1985 — Lei Caó',
    'Lei estadual 14.521/2022 — SEPROMI',
    'Lei estadual 13.182/2014 — Estatuto da Igualdade Racial da Bahia',
    'Leis 10.678/2003, 13.341/2016, 14.600/2023; Decreto 4.886/2003',
    'Jurisprudência dos tribunais superiores']),
  ('Medicina Legal', 1, array[
    'Conceito, divisões; corpo de delito, perícia e peritos',
    'Documentos médico-legais; identidade e identificação',
    'Lesões por ação contundente, cortante, perfurante e mistas',
    'Lesões e mortes por projéteis de arma de fogo',
    'Conceito e diagnóstico da morte; fenômenos cadavéricos',
    'Cronotanatognose, comoriência, exumação; morte súbita e suspeita',
    'Exame e preservação de locais de crime',
    'Toxicomanias e embriaguez; ação térmica, elétrica e química',
    'Crimes contra a dignidade sexual: vestígios e coleta',
    'Asfixias',
    'Aborto, infanticídio e abandono de recém-nascido',
    'Imputabilidade penal e capacidade civil',
    'Cadeia de custódia, vestígios e evidências',
    'Violência doméstica e familiar: aspectos médico-legais']),
  ('Legislação Geral', 2, array[
    'Lei estadual 6.677/1994 — Estatuto do Servidor Público da Bahia',
    'Lei estadual 14.634/2023 — Licitações e contratos (BA)',
    'Lei estadual 12.209/2011 — Processo administrativo (BA)',
    'Lei estadual 11.370/2009 — Lei Orgânica da Polícia Civil da Bahia',
    'Lei 8.906/1994 — Estatuto da Advocacia']),

  ('Noções de Contabilidade', 1, array[
    'Fundamentos: conceitos, objeto, usuários, estrutura conceitual',
    'Patrimônio: ativo, passivo e patrimônio líquido; equação fundamental',
    'Atos e fatos administrativos; fatos permutativos, modificativos e mistos',
    'Contas contábeis: classificação, débito, crédito e saldo',
    'Plano de contas',
    'Escrituração: partidas dobradas, lançamentos, livros, retificação',
    'Operações diversas: tributos, folha, estoques, CMV, depreciação',
    'Análise e conciliação contábil; conciliação bancária',
    'Balancete de verificação',
    'Balanço Patrimonial e DRE; notas explicativas',
    'Matemática financeira: juros simples e compostos, descontos, taxas',
    'Noções de finanças: fluxo de caixa, capital de giro, indicadores',
    'Orçamento público e privado',
    'Noções de tributos']),
  ('Direito Administrativo', 2, array[
    'Organização administrativa: administração direta e indireta',
    'Ato administrativo: conceito, requisitos, atributos, espécies, extinção',
    'Agentes públicos: cargo, emprego e função pública',
    'Poderes administrativos; uso e abuso do poder',
    'Licitações e contratos — Lei 14.133/2021',
    'Controle da Administração Pública',
    'Responsabilidade civil do Estado',
    'Regime jurídico-administrativo: princípios',
    'Lei estadual 11.370/2009 — Lei Orgânica da PC-BA',
    'Lei estadual 6.677/1994 — Estatuto do Servidor (BA)',
    'Lei de Improbidade Administrativa',
    'Jurisprudência dos tribunais superiores']),
  ('Direito Constitucional', 2, array[
    'Direitos e deveres individuais e coletivos',
    'Direitos sociais; nacionalidade; cidadania e direitos políticos',
    'Garantias constitucionais individuais e coletivas',
    'Organização político-administrativa do Estado',
    'Administração pública: disposições gerais e servidores',
    'Poderes Executivo, Legislativo e Judiciário',
    'Defesa do Estado; segurança pública (art. 144)',
    'Jurisprudência dos tribunais superiores']),
  ('Direito Penal', 3, array[
    'Princípios do Direito Penal',
    'Aplicação da lei penal no tempo e no espaço',
    'Infração penal: elementos e espécies',
    'Fato típico: conduta, resultado, nexo causal e tipicidade',
    'Crime doloso e culposo; erro de tipo',
    'Consumação e tentativa; desistência e arrependimento',
    'Ilicitude e causas de exclusão',
    'Culpabilidade: elementos e causas de exclusão; erro de proibição',
    'Concurso de pessoas',
    'Concurso de crimes',
    'Penas: espécies, aplicação, regimes, substituição',
    'Extinção da punibilidade; prescrição',
    'Crimes contra a pessoa',
    'Crimes contra o patrimônio',
    'Crimes contra a dignidade sexual',
    'Crimes contra a incolumidade e a paz pública',
    'Crimes contra a fé pública',
    'Crimes contra a Administração Pública',
    'Crimes contra o Estado Democrático de Direito',
    'Jurisprudência dos tribunais superiores']),
  ('Direito Processual Penal', 3, array[
    'Princípios; sistemas processuais; lei processual no tempo e espaço',
    'Inquérito policial e investigação preliminar',
    'Acordo de não persecução penal; controle externo da atividade policial',
    'Ação penal e ação civil ex delicto',
    'Jurisdição e competência criminal',
    'Provas: teoria geral, meios de prova e de obtenção de prova',
    'Prisões: flagrante, preventiva e temporária',
    'Medidas cautelares diversas da prisão; liberdade provisória',
    'Questões e processos incidentes; medidas assecuratórias',
    'Sujeitos do processo; comunicação dos atos processuais',
    'Procedimento comum: ordinário, sumário e sumaríssimo',
    'Nulidades',
    'Sentença penal, recursos e ações autônomas de impugnação',
    'Jurisprudência dos tribunais superiores']),
  ('Legislação Penal Especial', 2, array[
    'Lei 11.343/2006 — Lei de Drogas',
    'Lei 11.340/2006 — Lei Maria da Penha',
    'Lei 10.826/2003 — Estatuto do Desarmamento',
    'Lei 8.072/1990 — Crimes Hediondos',
    'Lei 12.850/2013 — Organizações Criminosas',
    'Lei 15.358/2026 — Marco Legal de Combate ao Crime Organizado',
    'Lei 9.455/1997 — Crimes de Tortura',
    'Lei 13.869/2019 — Abuso de Autoridade',
    'Lei 8.069/1990 — Estatuto da Criança e do Adolescente',
    'Lei 7.960/1989 — Prisão Temporária',
    'Lei 9.296/1996 — Interceptação Telefônica',
    'Lei 9.613/1998 — Lavagem de Dinheiro',
    'Lei 7.210/1984 — Execução Penal',
    'Leis 9.099/1995 e 10.259/2001 — Juizados Especiais Criminais']),
  ('Legislação Extravagante', 2, array[
    'Lei 5.553/1968 — Documentos de identificação pessoal',
    'Lei 7.716/1989 — Crimes de preconceito de raça ou cor',
    'Lei 9.503/1997 — Crimes de Trânsito (CTB)',
    'Lei 9.605/1998 — Crimes Ambientais',
    'Lei 10.741/2003 — Estatuto da Pessoa Idosa',
    'Lei 7.492/1986 — Crimes contra o Sistema Financeiro',
    'Lei 4.737/1965 — Código Eleitoral',
    'Lei 8.137/1990 — Crimes contra a ordem tributária',
    'Lei 8.078/1990 — Crimes contra as relações de consumo (CDC)',
    'Lei 8.429/1992 — Improbidade Administrativa',
    'Declaração Universal dos Direitos Humanos (1948)',
    'Decreto-Lei 3.688/1941 — Contravenções Penais',
    'Lei 12.037/2009 — Identificação Criminal',
    'Lei 12.830/2013 — Investigação Criminal',
    'Lei 9.807/1999 — Proteção a Vítimas e Testemunhas',
    'Lei 14.597/2023 — Lei Geral do Esporte (infrações penais)',
    'Lei 13.146/2015 — Estatuto da Pessoa com Deficiência (crimes)',
    'Lei 14.344/2022 — Lei Henry Borel']),
  ('Estatística', 1, array[
    'Estatística descritiva: gráficos, diagramas e tabelas',
    'Medidas de posição, dispersão, assimetria e curtose',
    'Probabilidade: definições básicas e axiomas',
    'Probabilidade condicional e independência',
    'Amostragem: aleatória simples, estratificada, sistemática, conglomerados',
    'Tamanho amostral',
    'Teorema de Bayes']);

  for r in select * from _e loop
    did := uuid_generate_v4();
    insert into disciplinas(id, user_id, nome, peso)
    values (did, uid, r.nome, r.peso);
    insert into assuntos(user_id, disciplina_id, nome, ordem)
    select uid, did, a, ord - 1
    from unnest(r.assuntos) with ordinality as t(a, ord);
  end loop;

  update disciplinas set prioridade = 'Alta'  where user_id = uid and peso >= 3;
  update disciplinas set prioridade = 'Média' where user_id = uid and peso = 2;
  update disciplinas set prioridade = 'Baixa' where user_id = uid and peso <= 1;
end $$;

notify pgrst, 'reload schema';

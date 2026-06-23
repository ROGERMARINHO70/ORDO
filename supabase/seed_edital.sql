-- seed_edital: popula disciplinas + assuntos para um user_id
-- Chamada via RPC no 1º login: select seed_edital();
-- A função lê auth.uid() internamente.

create or replace function seed_edital()
returns void language plpgsql security definer as $$
declare
  uid uuid := auth.uid();
  did uuid;
begin
  -- Garante config padrão
  insert into user_config(user_id) values (uid) on conflict (user_id) do nothing;

  -- Só semeia se ainda não há disciplinas
  if exists(select 1 from disciplinas where user_id = uid limit 1) then return; end if;

  -- Helper local
  create temp table if not exists _seed(nome text, peso int, assuntos text[]);
  truncate _seed;

  insert into _seed values
    ('Língua Portuguesa', 2, array[
      'Interpretação de texto','Crase','Concordância','Regência','Pontuação','Ortografia']),
    ('Raciocínio Lógico-Matemático', 1, array[
      'Lógica proposicional','Argumentação','Combinatória','Probabilidade','Porcentagem']),
    ('Noções de Informática', 1, array[
      'Segurança da informação','Redes e internet','Pacote Office','Sistemas operacionais']),
    ('Direito Constitucional', 2, array[
      'Direitos e garantias fundamentais','Organização do Estado',
      'Segurança pública (art.144)','Administração pública']),
    ('Direito Administrativo', 2, array[
      'Atos administrativos','Poderes administrativos','Licitações (14.133)',
      'Improbidade','Servidores públicos']),
    ('Direito Penal', 3, array[
      'Aplicação da lei penal','Teoria do crime','Crimes contra a pessoa',
      'Crimes contra o patrimônio','Crimes contra a administração pública']),
    ('Direito Processual Penal', 3, array[
      'Inquérito policial','Prisão e liberdade provisória','Prisão em flagrante',
      'Provas','Competência','Ação penal']),
    ('Legislação Penal Especial', 2, array[
      'Lei de Drogas (11.343)','Maria da Penha','Estatuto do Desarmamento',
      'Crimes hediondos','Organização Criminosa']),
    ('Direitos Humanos', 1, array[
      'Tratados internacionais','Direitos fundamentais','Uso da força']),
    ('Criminologia', 1, array[
      'Escolas criminológicas','Vitimologia','Prevenção criminal']),
    ('Medicina Legal', 1, array[
      'Tanatologia','Lesões corporais','Sexologia forense','Documentos médico-legais']),
    ('Legislação Institucional PC-BA', 2, array[
      'Lei Orgânica da PC-BA','Estatuto do servidor (BA)','Regime disciplinar']),
    ('Atualidades', 1, array[
      'Segurança pública','Cenário político-econômico','Bahia em foco']),
    ('História e Geografia da Bahia', 1, array[
      'Formação histórica','Geografia e regiões','Aspectos socioeconômicos']);

  -- Insere disciplinas e assuntos
  for did, nome, peso in
    select uuid_generate_v4(), s.nome, s.peso from _seed s
  loop
    insert into disciplinas(id, user_id, nome, peso, prioridade)
    values (
      did, uid, nome, peso,
      case when peso >= 3 then 'Alta' when peso >= 2 then 'Média' else 'Baixa' end::prioridade_tipo
    );

    insert into assuntos(user_id, disciplina_id, nome, ordem)
    select uid, did, unnest(s.assuntos), ordinality - 1
    from _seed s
    cross join lateral unnest(s.assuntos) with ordinality
    where s.nome = nome;
  end loop;

  drop table if exists _seed;
end $$;

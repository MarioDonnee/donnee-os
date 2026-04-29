# Sprint 10 - Release Candidate Checklist

Use este checklist antes de tratar o Donnée OS como pré-produto interno pronto para uso recorrente.

## Ambiente

- [ ] Backend iniciado sem erro em `http://localhost:8000`.
- [ ] Frontend iniciado sem erro em `http://localhost:5173`.
- [ ] Login Google/Supabase funciona com usuário allowlisted.
- [ ] Logout encerra a sessão e remove acesso às rotas internas.
- [ ] Usuário `PENDING` vê tela de acesso pendente.
- [ ] Usuário `INACTIVE` vê tela de acesso inativo.

## Fluxo Principal

- [ ] Criar cliente manualmente.
- [ ] Editar cliente e confirmar persistência após refresh.
- [ ] Abrir Client Detail e ver projetos, tarefas abertas e atividade.
- [ ] Criar projeto manualmente.
- [ ] Criar projeto por template.
- [ ] Confirmar que o template cria tarefas padrão com prazos relativos.
- [ ] Abrir Project Detail e ver health score, risk status, tarefas e atividade.
- [ ] Criar task manualmente.
- [ ] Abrir task detail pelo Kanban.
- [ ] Editar título, descrição, status, prioridade, assignee e prazo.
- [ ] Mover task entre colunas via drag-and-drop.
- [ ] Confirmar `completed_at` ao mover para `DONE` e limpeza ao sair de `DONE`.

## Task Detail

- [ ] Criar comentário.
- [ ] Editar comentário.
- [ ] Remover comentário via soft delete.
- [ ] Criar label.
- [ ] Adicionar label à task.
- [ ] Remover label da task.
- [ ] Criar checklist item.
- [ ] Editar checklist item.
- [ ] Marcar checklist item como concluído.
- [ ] Atribuir checklist item a outro usuário e verificar notificação.
- [ ] Confirmar progresso do checklist no card e no detalhe.

## Visões Operacionais

- [ ] Kanban mostra cards sem status duplicado dentro do card.
- [ ] Kanban filtra por busca, projeto, status, prioridade, label, atrasadas e minhas tarefas.
- [ ] Tasks Table ordena e edita status/prioridade inline.
- [ ] My Work mostra apenas tarefas atribuídas ao usuário atual.
- [ ] Calendar mostra tarefas e marcos por prazo.
- [ ] Timeline mostra tarefas por projeto com início/prazo.
- [ ] Notifications lista recentes, filtra não lidas e marca individual/globalmente como lida.
- [ ] Dashboard mostra métricas, tarefas atrasadas, atividade recente e projetos em risco.
- [ ] Team lista usuários e respeita permissões de gestão.

## Permissões

- [ ] `ADMIN` consegue ler e alterar tudo.
- [ ] `MANAGER` consegue criar/editar clientes, projetos, tasks e usar templates.
- [ ] `ANALYST` consegue criar/editar/mover tasks, comentários, labels e checklists.
- [ ] `ANALYST` não consegue gerenciar usuários.
- [ ] `VIEWER` consegue ler dados principais.
- [ ] `VIEWER` não consegue criar, editar, mover ou deletar entidades.
- [ ] `/db-test` responde apenas para `ADMIN`.

## Activity Logs

- [ ] Criar/editar cliente gera log.
- [ ] Criar/editar projeto gera log.
- [ ] Criar projeto por template gera log no projeto e nas tasks criadas.
- [ ] Criar task gera log.
- [ ] Mover task gera log.
- [ ] Editar prioridade/status/prazo/assignee gera log.
- [ ] Criar/editar/deletar comentário gera log.
- [ ] Adicionar/remover label gera log.
- [ ] Criar/editar/concluir checklist item gera log.
- [ ] Recalculo relevante de health score gera log.

## Notificações e Risco

- [ ] Atribuir task a outro usuário cria notificação.
- [ ] Atribuir checklist item a outro usuário cria notificação.
- [ ] Task atribuída marcada como `URGENT` cria notificação uma vez.
- [ ] Task atribuída movida para `REVIEW` cria notificação uma vez.
- [ ] Task atribuída atrasada cria notificação uma vez.
- [ ] `due_status` aparece coerente: sem prazo, no prazo, em breve, hoje, atrasada, concluída.
- [ ] `risk_status` aparece coerente: saudável, atenção, em risco, crítico.
- [ ] `health_score` do projeto muda após criar, editar ou mover tasks.

## UI/UX

- [ ] Dashboard não quebra em desktop e mobile.
- [ ] Clients e Client Detail mantêm layout consistente.
- [ ] Projects e Project Detail mantêm chips/health/risk legíveis.
- [ ] Kanban não sobrepõe texto em cards estreitos.
- [ ] Task Detail mantém formulários e listas legíveis.
- [ ] Tasks Table não estoura horizontalmente sem wrapper.
- [ ] My Work tem grupos legíveis em mobile.
- [ ] Calendar e Timeline continuam navegáveis em telas menores.
- [ ] Empty states usam `empty-state`.
- [ ] Erros usam `error-banner`.
- [ ] Loading usa `muted`, skeletons ou padrão equivalente.

## Checks Técnicos

- [ ] `python -m compileall app`.
- [ ] `npm run lint`.
- [ ] `npm run build`.
- [ ] Nenhum segredo foi commitado.
- [ ] `.env.example`, `backend/.env.example` e `frontend/.env.example` estão sem valores reais.
- [ ] README explica como rodar backend, frontend, migrations/seeds e limitações atuais.

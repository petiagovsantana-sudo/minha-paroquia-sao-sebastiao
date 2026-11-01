# Paróquia São Sebastião – Anitápolis/SC

Protótipo navegável do aplicativo **Minha Paróquia** (dados fictícios), alinhado ao *Caderno Mestre de Especificação Funcional — 20 módulos* (consolidação 30/10/2026).

> Protótipo de testes. Não é sistema de produção: não há senha real nem banco de dados. Os dados ficam só no navegador de quem testa.

## Arquivos
- `index.html` — página e estilos (cores oficiais da identidade visual)
- `app.js` — aplicativo (perfis, painel, solicitações, processos, catequese, agenda, tarefas)
- `ivc.js` — itinerário IVC da turma iniciada em 2026 (2026–2030), gerado da lista de chamada
- `manifest.webmanifest` e `sw.js` — instalação no celular (PWA)
- `logo.png`, `padrao.png` — identidade visual

## O que já dá para testar
- 15 comunidades oficiais (São Miguel e Acampamento fora da contagem)
- Protocolos com histórico, prazo, prioridade e decisões do pároco (aprovar, devolver, pedir esclarecimentos, não aprovar)
- Processos com barra de andamento: segunda via de certidão, Batismo, Matrimônio e reserva/locação de salão (PF/PJ)
- WhatsApp manual (abre a conversa com texto pronto; nunca declara envio sozinho)
- Catequese IVC: turma 2026 com 23 catequizandos fictícios, chamada P/F/J, encontros de famílias, alertas de faltas, exportação e importação CSV
- Agenda pública/institucional/reservada com durações padrão e bloqueio de conflitos
- Tarefas: concluir ≠ encerrar, prorrogação com justificativa
- Trilha de auditoria

## Publicação
Ative o GitHub Pages em *Settings → Pages → Branch: main / root*.

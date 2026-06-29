# Lumora

Plataforma de aprendizagem com IA — flashcards, repetição espaçada, modos de estudo (Learn/Test/Match), notas e pastas. UI Liquid Glass. Backend de auth + sincronização via Supabase.

## Estrutura
- `index.html` — tela de login (entrada). Auth real via Supabase.
- `app/` — o aplicativo (SPA estática). Gate por sessão; dados sincronizam na nuvem por usuário.
- `site/` — landing page.

## Stack
HTML/CSS/JS puro · Supabase (auth + Postgres/RLS) · SheetJS (import Excel/CSV).

## Local
Sirva a raiz por HTTP (login e app precisam do mesmo origin):

```
python -m http.server 5500
# abra http://localhost:5500/
```

## Deploy
Site estático. Deploy direto na Vercel (sem build).

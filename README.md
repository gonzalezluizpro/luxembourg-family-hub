# Family Activity Hub

Nome sugerido: FamilyLoop Luxembourg.
Conecta este projeto ao Supabase. Cria uma tabela 'activities' com: id (uuid, pk), name (text), description (text), category (text — valores: sport, music, art, nature, scouts, culture, swimming, playground, event, community), age_min (int), age_max (int), city (text), latitude (float), longitude (float), entry_type (text — valores: open, registration_required, contact_required, members_only), price_info (text), languages (text array), is_recurring (boolean), schedule_info (text), source_url (text), source_name (text), created_at (timestamp default now). Cria também uma tabela 'interest' com: id (uuid, pk), activity_id (uuid, fk para activities), created_at (timestamp default now). Não precisa de autenticação de usuário por enquanto.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://luxembourg-family-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6e0124fd-fd3d-4255-ae97-59bd79ddce50).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

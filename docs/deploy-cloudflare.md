# Deploy Cloudflare Pages

## Build

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `.`
- Node version: `20`

## Environment variables

As variaveis publicas ficam em `wrangler.toml`, porque este projeto usa Wrangler para configurar o Pages.

No Dashboard do Cloudflare, configure apenas os secrets em `Settings > Environment variables`.

```env
FIREBASE_SERVICE_ACCOUNT_B64=
CLOUDINARY_API_SECRET=
CLOUDFLARE_DEPLOY_HOOK_URL=
```

`FIREBASE_ADMIN_UIDS` fica em `wrangler.toml` e deve receber os UIDs dos administradores separados por virgula.

## Deploy hook

1. Entre no projeto Cloudflare Pages.
2. Abra `Settings > Builds & deployments`.
3. Crie um Deploy Hook para a branch `main`.
4. Copie a URL para `CLOUDFLARE_DEPLOY_HOOK_URL`.

## Validacao

Antes de apontar o dominio principal:

1. Teste o dominio `.pages.dev`.
2. Acesse `/catalogo/`.
3. Acesse uma pagina em `/catalogo/maquinas/slug/`.
4. Faça login no admin.
5. Envie uma imagem.
6. Edite uma maquina e publique.
7. Aguarde o build finalizar.
8. Valide `robots.txt`, `sitemap.xml` e canonical das paginas.

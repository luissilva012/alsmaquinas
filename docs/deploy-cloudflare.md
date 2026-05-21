# Deploy Cloudflare Pages

## Build

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `.`
- Node version: `20`

## Environment variables

Configure as variaveis no painel do Cloudflare Pages em `Settings > Environment variables`.

```env
NODE_VERSION=20

FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=catalogo-als.firebaseapp.com
FIREBASE_PROJECT_ID=catalogo-als
FIREBASE_STORAGE_BUCKET=catalogo-als.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=171009163821
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=
FIREBASE_ADMIN_UIDS=

FIREBASE_SERVICE_ACCOUNT_B64=

CLOUDINARY_CLOUD_NAME=dooprpnho
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_PRESET=als_admin_products
CLOUDINARY_FOLDER=als-maquinas/produtos

CLOUDFLARE_DEPLOY_HOOK_URL=
```

`FIREBASE_ADMIN_UIDS` deve receber os UIDs dos administradores separados por virgula.

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

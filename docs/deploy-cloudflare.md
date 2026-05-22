# Deploy Cloudflare Pages

## Build

- Framework preset: `None`
- Production branch: `main`
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

## Desenvolvimento local

1. Preencha `.env` a partir de `.env.example`.
2. Rode `npm run dev`. Esse comando exporta o catalogo do Firebase, gera as paginas estaticas locais e sobe o Pages local.
3. Depois de criar, editar ou remover um produto pelo admin local, rode `npm run build` ou reinicie `npm run dev` para atualizar as rotas estaticas locais antes de abrir a URL direta do produto.
4. Use `npm run build` antes de publicar para exportar o catalogo, gerar paginas e validar a configuracao.

## Validacao

Antes de publicar alteracoes na branch principal:

1. Teste o dominio `.pages.dev` ou um preview do Cloudflare Pages.
2. Acesse `/catalogo/`.
3. Acesse uma pagina em `/catalogo/maquinas/slug/`.
4. Faca login no admin.
5. Envie uma imagem.
6. Edite uma maquina e publique.
7. Aguarde o build finalizar.
8. Valide `robots.txt`, `sitemap.xml` e canonical das paginas.

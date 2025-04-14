<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">Um backend teste para streaming de videos em alto desempenho, usando Nest, AWS S3, Cloudfront e Signed URLs</p>

## 📝 Descrição
Apenas um projeto teste pra entender mais sobre o funcionamento de streaming de videos em alto desempenho e com segurança

## ⚙️ Instalação das dependências
Usei a versão 20 do Node nesse projeto, com NPM

```bash
$ npm install
```

## 📦 Setup na AWS
Abaixo deixo um guia de como configurar uma distribuição de vídeo segura usando **Amazon S3** como origem, **CloudFront** como CDN e **Signed URLs** para controlar o acesso ao conteúdo.

### ✅ 1. Criar bucket no S3
1. Acesse o console da AWS → S3 → Criar bucket.
2. Dê um nome, ex: `video-streaming-test`
3. Região: escolha conforme sua localização.
4. **Desmarque** a opção "Bloquear todo o acesso público".
5. Após criação, vá em **Permissões > Política de acesso ao bucket**:
   - **Não permita acesso público**.
   - O acesso será feito exclusivamente via CloudFront.
6. Faça o upload do video para teste (ex: `video_sample.mp4`).

---

### 🌐 2. Criar uma distribuição no CloudFront
1. Vá para o console da AWS → CloudFront → Create Distribution.
2. Em **Origin domain**, selecione o bucket S3 que você criou.
3. Configure:
   - **Origin access**: `Origin access control settings (recommended)`
   - Clique em `Create control setting`:
     - Nome: `S3-OAC`
     - Tipo de acesso: `Public Read Access (OAC)`
     - Associe com o bucket no final do processo
   - **Viewer protocol policy**: `Redirect HTTP to HTTPS`
   - **Allowed HTTP methods**: `GET, HEAD`
4. Em **Cache Policy**:
   - Use a padrão `CachingOptimized`, ou crie uma customizada com suporte a query strings se for usar URLs assinadas com auth própria.
5. Em **Price class**:
   - Pode manter `Use only US, Canada and Europe` para testar.
6. Clique em **Create distribution**.

> PS: Ao criar, uma URL será gerada para a sua distribuição, copie essa URL e cole no seu arquivo `.env` em `AWS_CLOUDFRONT_URL`

---

### 🔐 3. Gerar chave pública e privada para Signed URLs

```bash
# Gera a chave privada (usada no backend)
openssl genrsa -out private_key.pem 2048

# Gera a chave pública (será usada na AWS)
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

> PS: A `private_key.pem` gerada deve ser ficar no diretório `/certs` do projeto.
>
> Serve para autenticar o backend na AWS, para que tenha permissão de gerar as Signed URLs.

---

### 📥 4. Registrar a chave pública no CloudFront
1. Acesse CloudFront → Public keys → Create public key
2. Nome: `nest-video-key`
3. Cole o conteúdo completo de public_key.pem, incluindo:
```
-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----
```
4. Clique em Create public key
> PS: Copie o ID dessa chave que foi gerada e cole no seu arquivo `.env` em `AWS_KEY_PAIR_ID`

---

### 🧱 5. Criar um Key Group
1. Vá em CloudFront → Key groups → Create key group
2. Nome: nest-key-group
3. Selecione a chave pública criada anteriormente
4. Clique em Create key group

---

### 🔗 6. Associar o Key Group à distribuição
1. Volte para sua distribuição CloudFront
2. Acesse a aba Behaviors
3. Edite o comportamento padrão (`Default (*)`)
4. Marque:
    - `Restrict viewer access (use signed URLs or signed cookies)`
5. Selecione o Key Group criado (`nest-key-group`)
6. Salve as alterações

## 🚀 Execução do projeto
```bash
# Dev com watch mode
$ npm run start:dev
```

## ▶️ Testando
Você pode consumir o streaming do video em qualquer frontend através da tag `<video>`.

Se quiser apenas fazer um teste inicial, crie um arquivo `index.html`, com o seguinte código:

```
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <title>Teste de Streaming</title>
</head>
<body>
  <h1>Streaming com CloudFront</h1>
  <video id="videoPlayer" controls width="600"></video>

  <script>
    async function loadVideo() {
      const filename = 'NOME_DO_SEU_VIDEO_AQUI.mp4';
      const res = await fetch(`http://localhost:3000/video/signed-url?filename=${filename}`);
      const data = await res.json();

      const video = document.getElementById('videoPlayer');
      video.src = data.url;
    }

    loadVideo();
  </script>
</body>
</html>
```

Você pode usar `npx serve` no diretório onde está o arquivo para que possa acessá-lo no navegador em alguma porta, ex: `http://localhost:55124`

> PS: Não se esqueça de alterar as configurações de CORS no arquivo `main.ts` do projeto, para que seu frontend consiga acessar a API.

E pronto, o `index.html` vai bater na API de video do backend, que vai retornar uma Signed URL para o video que será carregado via Cloudfront, já usando boas práticas de Streaming.

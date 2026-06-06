# Prevencion Minera Chile

Aplicacion web tipo dashboard para controlar cursos, documentacion, acciones preventivas y cumplimiento SST por faena minera en Chile.

## Funcionalidades

- Vista responsive para escritorio y movil.
- Filtros por faena, categoria, estado y busqueda libre.
- Indicadores de cumplimiento global, cursos al dia, documentos vencidos y acciones criticas.
- Ranking operativo por faena minera.
- Tabla de cursos, documentacion e hitos preventivos.
- Exportacion CSV de los registros filtrados.
- Modo PWA: se puede instalar como aplicacion cuando se publica por HTTPS.
- Service worker para cache offline basico.
- Workflow incluido para publicar automaticamente en GitHub Pages.

## Estructura

```text
.
|-- .github/workflows/pages.yml
|-- assets/
|   |-- app-icon.svg
|   `-- mining-dashboard-header.svg
|-- app.js
|-- data.js
|-- index.html
|-- manifest.webmanifest
|-- package.json
|-- server.js
|-- styles.css
`-- sw.js
```

## Ejecutar localmente

Con Node instalado:

```bash
npm start
```

Luego abre:

```text
http://127.0.0.1:4173
```

Tambien puedes abrir `index.html` directo en el navegador, aunque la instalacion PWA y el service worker funcionan mejor por HTTP/HTTPS.

## Subir como proyecto en GitHub

### Opcion sin Git instalado

1. Entra a GitHub y crea un repositorio nuevo, por ejemplo `prevencion-minera-chile`.
2. Elige `Add file > Upload files`.
3. Sube todos los archivos y carpetas de este proyecto, incluida la carpeta `.github`.
4. Confirma con `Commit changes`.
5. Entra a `Settings > Pages`.
6. En `Build and deployment`, selecciona `GitHub Actions`.
7. Ve a la pestana `Actions` y ejecuta o espera el workflow `Publicar en GitHub Pages`.
8. GitHub entregara un link tipo `https://usuario.github.io/prevencion-minera-chile/`.

### Opcion con Git instalado

```bash
git init
git add .
git commit -m "Crear aplicacion de prevencion minera"
git branch -M main
git remote add origin https://github.com/USUARIO/prevencion-minera-chile.git
git push -u origin main
```

Despues activa `Settings > Pages > GitHub Actions`.

## Editar datos

Los datos de ejemplo estan en `data.js`.

- `sites`: faenas mineras, region, operacion, contrato, dotacion y nivel de riesgo.
- `records`: cursos, documentos y acciones con responsable, vencimiento, estado y cumplimiento.

Estados disponibles:

- `Al dia`
- `Por vencer`
- `Vencido`
- `Critico`

Categorias disponibles:

- `Cursos`
- `Documentacion`
- `Acciones`

## Referencias oficiales usadas como base

- Direccion del Trabajo: Decreto Supremo N. 44, gestion preventiva de riesgos laborales.  
  https://www.dt.gob.cl/portal/1626/w3-article-127643.html
- Direccion del Trabajo: materias reguladas por el DS 44.  
  https://www.dt.gob.cl/portal/1628/w3-article-127514.html
- SUSESO: Compendio de la Ley N. 16.744.  
  https://www.suseso.cl/613/w3-propertyvalue-68955.html
- Direccion del Trabajo: DS 594 sobre condiciones sanitarias y ambientales basicas.  
  https://www.dt.gob.cl/legislacion/1624/w3-article-59796.html
- Sernageomin: Reglamento de Seguridad Minera, DS 132.  
  https://www.sernageomin.cl/wp-content/uploads/2017/11/Reglamento-seguridad-minera.pdf
- Direccion del Trabajo: registro de Comites Paritarios de Higiene y Seguridad.  
  https://www.dt.gob.cl/portal/1626/w3-article-88388.html

## Nota importante

Esta aplicacion es una base operacional. Antes de usarla como sistema formal, valida los requisitos especificos de tu empresa, faena, organismo administrador y autoridad fiscalizadora correspondiente.


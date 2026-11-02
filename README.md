# Invoicing Service (Factura Electrónica)

Microservicio NestJS base para facturación electrónica. Inicialmente integra **Aliaddo** como provider (adapter interno).

## Reglas de arquitectura (repo MeuSalud)

- Este servicio se debe consumir **solo** a través de `meusaludgateway` (BFF).
- No asumir `doctorId` por URL/query desde el front: el gateway provee `x-role`, `x-auth-user-id`, `x-subject-id`.
- Si en el futuro se agrega RabbitMQ: respetar la regla `amqplib` (import por named exports, no default import).

## Docs de integración

Pega la documentación de Aliaddo en `docs/aliaddo/` (markdown / PDFs / notas).

## Dev

```bash
npm install
npm run start:dev
```

Por defecto escucha en `PORT=3040` y expone el prefijo `invoicingms`.

## Variables de entorno (Aliaddo)

- Copia `invoicing-service/.env.example` a `invoicing-service/.env` y configura `ALIADDO_X_API_KEY`.
- Por defecto **siempre** se envía a endpoints de **pruebas**.
  - Para **habilitación**: `ALIADDO_MODE=habilitation` (usa `dianTestSetId`).
  - Para **producción**: `ALIADDO_MODE=production`.

## Endpoints (vía gateway)

- `POST /invoicingms/documents/invoice`
- `POST /invoicingms/documents/notes-cr`
- `POST /invoicingms/documents/notes-db`
- `POST /invoicingms/documents/support`
- `POST /invoicingms/documents/support/adjustments`
- `GET /invoicingms/documents` (lista del emisor)
- `GET /invoicingms/documents/:id` (detalle + logs/archivos)
- `POST /invoicingms/documents/:id/retry` (reintento controlado)
- `GET /invoicingms/documents/:id/files/:type/url` (descarga via URL firmada)
- `GET /invoicingms/resolutions` (resoluciones de Aliaddo)

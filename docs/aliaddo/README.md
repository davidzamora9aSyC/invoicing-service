# Aliaddo API (Documentación)

Coloca aquí toda la documentación necesaria para integrar la API de Aliaddo.

## Acceso rápido (MCP)

Si estás usando Codex CLI, puedes registrar el MCP de GitBook de Aliaddo (remoto) para consultar la doc sin descargarla:

```bash
codex mcp add api-facturacion-electronica --url https://factura-electronica.aliaddo.dev/~gitbook/mcp
codex mcp list
```

Sugerencia de estructura:

- `00-overview.md` (alcance, términos, ambientes)
- `01-auth.md` (tokens/headers, expiración, rotación)
- `02-endpoints.md` (crear factura, anular, consultar, eventos)
- `03-webhooks.md` (firma, retries, idempotencia)
- `04-errors.md` (códigos, ejemplos, handling)
- `05-samples/` (requests/responses reales)
- `06-testing.md` (sandbox, data de prueba)

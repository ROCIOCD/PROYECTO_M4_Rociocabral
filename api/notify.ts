// ─────────────────────────────────────────────────────────────────
// api/notify.ts
// Vercel Serverless Function — envía emails usando AWS SES.
// Credenciales leídas desde variables de entorno de Vercel,
// NUNCA desde el cliente ni hardcodeadas en el código.
//
// Variables de entorno requeridas en Vercel Dashboard:
//   AWS_ACCESS_KEY_ID      → Credencial IAM de AWS
//   AWS_SECRET_ACCESS_KEY  → Credencial IAM de AWS
//   AWS_REGION             → Región del endpoint SES (ej: us-east-2)
//   AWS_SES_FROM_EMAIL     → Email verificado en AWS SES
// ─────────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  SESClient,
  SendEmailCommand,
  type SendEmailCommandInput,
} from '@aws-sdk/client-ses';

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
}

interface EmailPayload {
  to: string;
  subject: string;
  // Campos estructurados para construir el template HTML
  taskTitle: string;
  taskStatus: string;
  taskDate?: string;
  taskTime?: string;
  taskUser?: string;
}

// ── CORS headers ──────────────────────────────────────────────────
// Necesarios para que el browser no bloquee la petición desde
// el frontend en producción (y para pruebas locales con Vite dev).
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCorsHeaders(res: VercelResponse): void {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
}

// ── Inicialización del cliente SES ────────────────────────────────
// Se instancia por invocación (serverless stateless) usando
// las variables de entorno de Vercel.
function createSESClient(): SESClient {
  const region = process.env['AWS_REGION'];
  const accessKeyId = process.env['AWS_ACCESS_KEY_ID'];
  const secretAccessKey = process.env['AWS_SECRET_ACCESS_KEY'];

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Variables de entorno de AWS no configuradas: ' +
      'AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY son requeridas.'
    );
  }

  return new SESClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

// ── Validación del payload ────────────────────────────────────────
function validatePayload(body: unknown): body is EmailPayload {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b['to'] === 'string' && b['to'].trim().length > 0 &&
    typeof b['subject'] === 'string' && b['subject'].trim().length > 0 &&
    typeof b['taskTitle'] === 'string' && b['taskTitle'].trim().length > 0 &&
    typeof b['taskStatus'] === 'string' && b['taskStatus'].trim().length > 0
  );
}

// ── Escape HTML básico (evita XSS en el template) ────────────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Badge de estado ───────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:       { bg: '#fef3c7', color: '#b45309', label: '⏳ Pendiente'   },
  'in-progress': { bg: '#dbeafe', color: '#1d4ed8', label: '🔄 En progreso' },
  completed:     { bg: '#dcfce7', color: '#15803d', label: '✅ Completada'  },
};

function getStatusBadge(status: string): { bg: string; color: string; label: string } {
  return STATUS_STYLES[status] ?? { bg: '#f3e8ff', color: '#7e22ce', label: status };
}

// ── Template HTML Sakura ──────────────────────────────────────────
function buildHtmlTemplate(payload: EmailPayload): string {
  const { taskTitle, taskStatus, taskDate, taskTime, taskUser } = payload;
  const badge = getStatusBadge(taskStatus);
  const dateLabel = taskDate
    ? escapeHtml(taskDate) + (taskTime ? `&nbsp; 🕒&nbsp;${escapeHtml(taskTime)}` : '')
    : 'Sin fecha límite';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MateCode Tasks &middot; Nueva Tarea</title>
</head>
<body style="margin:0;padding:0;background-color:#fff5f7;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff5f7;padding:40px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #fbcfe8;box-shadow:0 4px 24px rgba(219,39,119,0.08);overflow:hidden;">

        <!-- Header banner -->
        <tr>
          <td style="background:linear-gradient(135deg,#fce7f3 0%,#fbcfe8 50%,#f9a8d4 100%);padding:30px 24px 22px;text-align:center;">
            <!-- Flor de cerezo estilizada: 100% compatible con Gmail y clientes móviles -->
            <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 10px;">
              <tr>
                <td align="center" valign="middle" style="width:62px;height:62px;border-radius:50%;background:radial-gradient(circle at 35% 35%, #ffffff 30%, #fce7f3 70%, #f9a8d4 100%);border:2px solid #f472b6;box-shadow:0 4px 14px rgba(219,39,119,0.22);text-align:center;">
                  <span style="font-size:34px;line-height:62px;display:inline-block;filter:drop-shadow(0 2px 4px rgba(190,24,93,0.25));">&#x1F338;</span>
                </td>
              </tr>
            </table>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#be185d;letter-spacing:-0.3px;">MateCode Tasks</h1>
            <p style="margin:6px 0 0;font-size:12px;color:#9d174d;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;">Nueva tarea creada &middot; &#x1F338;</p>
          </td>
        </tr>

        <!-- Body con fondo decorativo degradado Sakura -->
        <tr>
          <td style="
            padding:26px 30px 24px;
            background-color:#fff5f8;
            background-image:radial-gradient(circle at 8% 8%, #fce7f3 0%, #fff5f8 35%, transparent 60%), radial-gradient(circle at 92% 92%, #fbcfe8 0%, #fff1f5 35%, transparent 60%), linear-gradient(180deg, #fff5f8 0%, #ffffff 45%, #fff1f5 100%);
          ">

            <!-- Detalle decorativo de ramitas/flores superior -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
              <tr>
                <td align="left" style="font-size:12px;color:#f472b6;letter-spacing:2px;font-family:sans-serif;">
                  &#x1F338;&nbsp;&#x1F33F;&nbsp;&#x2500;&#x2500;
                </td>
                <td align="right" style="font-size:12px;color:#f472b6;letter-spacing:2px;font-family:sans-serif;">
                  &#x2500;&#x2500;&nbsp;&#x1F33F;&nbsp;&#x1F338;
                </td>
              </tr>
            </table>

            <h2 style="margin:0 0 18px;font-size:19px;font-weight:700;color:#1e1b4b;line-height:1.35;">
              ${escapeHtml(taskTitle)}
            </h2>

            <!-- Tabla de datos con fondo semitransparente para legibilidad óptima -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:rgba(255,255,255,0.92);border-radius:12px;border:1px solid #fce7f3;box-shadow:0 2px 10px rgba(219,39,119,0.05);padding:6px 14px;">

              <!-- Estado -->
              <tr>
                <td style="padding:11px 0;border-bottom:1px solid #fce7f3;">
                  <span style="font-size:11px;font-weight:700;color:#9d174d;text-transform:uppercase;letter-spacing:0.7px;">Estado</span>
                </td>
                <td style="padding:11px 0;border-bottom:1px solid #fce7f3;text-align:right;">
                  <span style="display:inline-block;padding:4px 13px;border-radius:999px;font-size:12px;font-weight:700;background:${badge.bg};color:${badge.color};">
                    ${badge.label}
                  </span>
                </td>
              </tr>

              <!-- Fecha -->
              <tr>
                <td style="padding:11px 0;border-bottom:1px solid #fce7f3;">
                  <span style="font-size:11px;font-weight:700;color:#9d174d;text-transform:uppercase;letter-spacing:0.7px;">Fecha límite</span>
                </td>
                <td style="padding:11px 0;border-bottom:1px solid #fce7f3;text-align:right;">
                  <span style="font-size:14px;color:#374151;">${dateLabel}</span>
                </td>
              </tr>

              <!-- Usuario -->
              <tr>
                <td style="padding:11px 0;">
                  <span style="font-size:11px;font-weight:700;color:#9d174d;text-transform:uppercase;letter-spacing:0.7px;">Creado por</span>
                </td>
                <td style="padding:11px 0;text-align:right;">
                  <span style="font-size:14px;color:#374151;">${escapeHtml(taskUser ?? 'Usuario desconocido')}</span>
                </td>
              </tr>

            </table>

            <!-- Detalle decorativo inferior de pétalos -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
              <tr>
                <td align="center" style="font-size:11px;color:#f472b6;letter-spacing:4px;font-family:sans-serif;">
                  &#x1F338;&nbsp;&middot;&nbsp;&#x2740;&nbsp;&middot;&nbsp;&#x1F338;
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:22px 32px 28px;text-align:center;border-top:1px solid #fce7f3;">
            <p style="margin:0 0 6px;font-size:15px;color:#be185d;font-weight:600;">¡Muchos éxitos con tus pendientes! 🌸</p>
            <p style="margin:0;font-size:11px;color:#9ca3af;">Correo enviado automáticamente por <strong style="color:#db2777;">MateCode Tasks</strong>. No respondás este mensaje.</p>
          </td>
        </tr>

      </table>
      <!-- / Card -->

      <p style="margin-top:18px;font-size:10px;color:#d1a3b5;">MateCode Tasks &middot; Powered by AWS SES</p>
    </td></tr>
  </table>

</body>
</html>`;
}

// ── Fallback texto plano ──────────────────────────────────────────
function buildTextFallback(payload: EmailPayload): string {
  const { taskTitle, taskStatus, taskDate, taskTime, taskUser } = payload;
  const dateLabel = taskDate ? taskDate + (taskTime ? ` ${taskTime}` : '') : 'Sin fecha límite';
  return [
    '🌸 MateCode Tasks — Nueva tarea creada',
    '-------------------------------------------',
    `Título : ${taskTitle}`,
    `Estado : ${taskStatus}`,
    `Fecha  : ${dateLabel}`,
    `Usuario: ${taskUser ?? 'desconocido'}`,
    '-------------------------------------------',
    '¡Muchos éxitos con tus pendientes!',
  ].join('\n');
}

// ── Helper: respuesta de error ────────────────────────────────────
function sendError(
  res: VercelResponse,
  status: number,
  error: string
): void {
  console.error(`[api/notify] ❌ Error ${status}:`, error);
  const response: ApiResponse = { success: false, data: null, error };
  res.status(status).json(response);
}


// ── Handler principal ─────────────────────────────────────────────
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {

  setCorsHeaders(res);

  // Preflight OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  console.log(`[api/notify] ▶ Solicitud recibida — método: ${req.method}`);

  // Solo acepta POST
  if (req.method !== 'POST') {
    return sendError(res, 405, `Método ${req.method ?? 'desconocido'} no permitido. Usá POST.`);
  }

  // Log del body para diagnóstico en Vercel logs (no expone secrets)
  console.log('[api/notify] Body recibido:', JSON.stringify(req.body));

  // Valida el payload
  if (!validatePayload(req.body)) {
    return sendError(res, 400, 'Payload inválido. Se requieren: to, subject, taskTitle, taskStatus.');
  }

  const { to, subject } = req.body as EmailPayload;
  const payload = req.body as EmailPayload;

  // ⚠️  La variable en Vercel Dashboard se llama AWS_SES_FROM_EMAIL
  const fromEmail = process.env['AWS_SES_FROM_EMAIL'];

  if (!fromEmail) {
    return sendError(res, 500, 'Variable de entorno AWS_SES_FROM_EMAIL no configurada.');
  }

  console.log(`[api/notify] Enviando email → From: ${fromEmail} | To: ${to} | Subject: "${subject}"`);

  // Construye y envía el comando SES
  try {
    const client = createSESClient();
    const htmlBody = buildHtmlTemplate(payload);
    const textBody = buildTextFallback(payload);

    const params: SendEmailCommandInput = {
      Source: fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    const result = await client.send(command);

    console.log(`[api/notify] ✅ Email enviado — MessageId: ${result.MessageId ?? '(sin id)'}`);

    const response: ApiResponse<{ messageId: string }> = {
      success: true,
      data: { messageId: result.MessageId ?? '' },
    };
    res.status(200).json(response);

  } catch (err: unknown) {
    // Log completo del objeto de error de AWS para diagnóstico en Vercel logs
    console.error('[api/notify] ❌ Error completo de AWS SES:', err);
    const message = err instanceof Error ? err.message : 'Error desconocido al enviar email.';
    sendError(res, 500, message);
  }
}

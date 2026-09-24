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
          <td style="background:linear-gradient(135deg,#fce7f3 0%,#fbcfe8 50%,#f9a8d4 100%);padding:32px 32px 24px;text-align:center;">
            <!-- Flor animada: GIF transparente de cerezo -->
            <img
              src="https://media.giphy.com/media/3o7TKSjRrfIPjeiVyO/giphy.gif"
              alt="Flor de cerezo"
              width="56" height="56"
              style="display:block;margin:0 auto 10px;border-radius:50%;border:2px solid #f9a8d4;box-shadow:0 0 12px rgba(219,39,119,0.18);"
            />
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#be185d;letter-spacing:-0.3px;">MateCode Tasks</h1>
            <p style="margin:6px 0 0;font-size:12px;color:#9d174d;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;">Nueva tarea creada</p>
          </td>
        </tr>

        <!-- Body con watermark de ramas sakura -->
        <tr>
          <td style="
            padding:28px 32px 24px;
            background-color:#fff8fb;
            background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22 opacity=%220.13%22><g fill=%22%23db2777%22><ellipse cx=%2230%22 cy=%2240%22 rx=%228%22 ry=%224%22 transform=%22rotate(-30 30 40)%22/><ellipse cx=%2240%22 cy=%2235%22 rx=%228%22 ry=%224%22 transform=%22rotate(30 40 35)%22/><ellipse cx=%2235%22 cy=%2228%22 rx=%228%22 ry=%224%22 transform=%22rotate(-60 35 28)%22/><ellipse cx=%2225%22 cy=%2232%22 rx=%228%22 ry=%224%22 transform=%22rotate(60 25 32)%22/><ellipse cx=%2235%22 cy=%2238%22 rx=%228%22 ry=%224%22/><circle cx=%2235%22 cy=%2238%22 r=%223%22 fill=%22%23fda4af%22/><line x1=%2235%22 y1=%2238%22 x2=%2235%22 y2=%2270%22 stroke=%22%23be185d%22 stroke-width=%222%22 stroke-linecap=%22round%22/><line x1=%2235%22 y1=%2255%22 x2=%2255%22 y2=%2245%22 stroke=%22%23be185d%22 stroke-width=%221.5%22 stroke-linecap=%22round%22/><line x1=%2235%22 y1=%2262%22 x2=%2215%22 y2=%2252%22 stroke=%22%23be185d%22 stroke-width=%221.5%22 stroke-linecap=%22round%22/><ellipse cx=%2257%22 cy=%2242%22 rx=%226%22 ry=%223%22 transform=%22rotate(-30 57 42)%22/><ellipse cx=%2265%22 cy=%2238%22 rx=%226%22 ry=%223%22 transform=%22rotate(30 65 38)%22/><ellipse cx=%2260%22 cy=%2233%22 rx=%226%22 ry=%223%22 transform=%22rotate(-60 60 33)%22/><ellipse cx=%2251%22 cy=%2236%22 rx=%226%22 ry=%223%22 transform=%22rotate(60 51 36)%22/><circle cx=%2258%22 cy=%2240%22 r=%222%22 fill=%22%23fda4af%22/><ellipse cx=%22140%22 cy=%22130%22 rx=%228%22 ry=%224%22 transform=%22rotate(-45 140 130)%22/><ellipse cx=%22150%22 cy=%22125%22 rx=%228%22 ry=%224%22 transform=%22rotate(45 150 125)%22/><ellipse cx=%22145%22 cy=%22118%22 rx=%228%22 ry=%224%22 transform=%22rotate(-70 145 118)%22/><ellipse cx=%22135%22 cy=%22122%22 rx=%228%22 ry=%224%22 transform=%22rotate(70 135 122)%22/><ellipse cx=%22145%22 cy=%22128%22 rx=%228%22 ry=%224%22/><circle cx=%22145%22 cy=%22128%22 r=%223%22 fill=%22%23fda4af%22/><line x1=%22145%22 y1=%22128%22 x2=%22145%22 y2=%22160%22 stroke=%22%23be185d%22 stroke-width=%222%22 stroke-linecap=%22round%22/><line x1=%22145%22 y1=%22145%22 x2=%22165%22 y2=%22135%22 stroke=%22%23be185d%22 stroke-width=%221.5%22 stroke-linecap=%22round%22/><line x1=%22145%22 y1=%22152%22 x2=%22125%22 y2=%22142%22 stroke=%22%23be185d%22 stroke-width=%221.5%22 stroke-linecap=%22round%22/></g></svg>');
            background-repeat: repeat;
            background-size: 200px 200px;
          ">

            <h2 style="margin:0 0 22px;font-size:19px;font-weight:700;color:#1e1b4b;line-height:1.35;">
              ${escapeHtml(taskTitle)}
            </h2>

            <!-- Tabla con fondo semitransparente para legibilidad sobre el watermark -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:rgba(255,255,255,0.88);border-radius:10px;border:1px solid #fce7f3;padding:4px 12px;">

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

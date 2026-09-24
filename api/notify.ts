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
  body: string;
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
    typeof b['body'] === 'string' && b['body'].trim().length > 0
  );
}

// ── Helper: respuesta de error ──────────────────────────────────
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
    return sendError(res, 400, 'Payload inválido. Se requieren: to (string), subject (string), body (string).');
  }

  const { to, subject, body } = req.body as EmailPayload;

  // ⚠️  La variable en Vercel Dashboard se llama AWS_SES_FROM_EMAIL
  const fromEmail = process.env['AWS_SES_FROM_EMAIL'];

  if (!fromEmail) {
    return sendError(res, 500, 'Variable de entorno AWS_SES_FROM_EMAIL no configurada.');
  }

  console.log(`[api/notify] Enviando email → From: ${fromEmail} | To: ${to} | Subject: "${subject}"`);

  // Construye y envía el comando SES
  try {
    const client = createSESClient();

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
          Text: {
            Data: body,
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

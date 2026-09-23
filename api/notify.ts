// ─────────────────────────────────────────────────────────────────
// api/notify.ts
// Vercel Serverless Function — envía emails usando AWS SES.
// Credenciales leídas desde variables de entorno de Vercel,
// NUNCA desde el cliente ni hardcodeadas en el código.
//
// Variables de entorno requeridas en Vercel Dashboard:
//   AWS_ACCESS_KEY_ID      → Credencial IAM de AWS
//   AWS_SECRET_ACCESS_KEY  → Credencial IAM de AWS
//   AWS_REGION             → Región del endpoint SES (ej: us-east-1)
//   SES_FROM_EMAIL         → Email verificado en AWS SES
// ─────────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  SESClient,
  SendEmailCommand,
  type SendEmailCommandInput,
} from '@aws-sdk/client-ses';
import type { EmailPayload, ApiResponse } from '../src/types';

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

// ── Handler principal ─────────────────────────────────────────────
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Solo acepta POST
  if (req.method !== 'POST') {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: `Método ${req.method ?? 'desconocido'} no permitido. Usá POST.`,
    };
    res.status(405).json(response);
    return;
  }

  // Valida el payload
  if (!validatePayload(req.body)) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: 'Payload inválido. Se requieren: to (string), subject (string), body (string).',
    };
    res.status(400).json(response);
    return;
  }

  const { to, subject, body } = req.body;
  const fromEmail = process.env['SES_FROM_EMAIL'];

  if (!fromEmail) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: 'Variable de entorno SES_FROM_EMAIL no configurada.',
    };
    res.status(500).json(response);
    return;
  }

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

    const response: ApiResponse<{ messageId: string }> = {
      success: true,
      data: { messageId: result.MessageId ?? '' },
      error: null,
    };
    res.status(200).json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido al enviar email.';
    console.error('[api/notify] Error SES:', message);

    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: message,
    };
    res.status(500).json(response);
  }
}

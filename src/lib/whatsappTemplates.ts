import { Client, Project, StudioSettings } from '../types/studio';

export interface WhatsAppTemplateItem {
  id: string;
  label: string;
  badge: string;
  buildMessage: () => string;
}

export function getProjectWhatsAppTemplates(
  project: Project,
  settings: StudioSettings,
  portalUrl: string,
  client?: Client
): WhatsAppTemplateItem[] {
  const name = client?.name ? client.name.split(' ')[0] : 'hola';
  const greeting = client?.name ? `Hola ${name} 👋` : '¡Hola! 👋';
  const pending = Math.max(0, project.price - project.amountPaid);
  const deposit50 = Math.round(project.price * 0.5);
  const missingFiles = project.clientChecklist
    .filter((i) => !i.completed)
    .map((i) => `• ${i.label}`)
    .join('\n');

  const reviewLink = project.links.frameio || project.links.drive || portalUrl;
  const finalLink = project.links.drive || project.links.wetransfer || portalUrl;

  return [
    {
      id: 'start_deposit',
      label: 'Pedir anticipo + Link en vivo',
      badge: 'Inicio',
      buildMessage: () =>
        `${greeting} Ya dejé registrado tu proyecto *"${project.title}"* en ${settings.studioName}.\n\n` +
        `💰 *Total:* ${settings.currency}${project.price.toLocaleString('es-ES')}\n` +
        `🚀 *Anticipo para agendar inicio:* ${settings.currency}${deposit50.toLocaleString('es-ES')}\n` +
        `📅 *Entrega estimada:* ${project.dueDate}\n\n` +
        `🔗 Aquí puedes ver el avance en tiempo real en cualquier momento:\n${portalUrl}`,
    },
    {
      id: 'missing_material',
      label: 'Pedir archivos faltantes',
      badge: 'Material',
      buildMessage: () =>
        `${greeting} Te escribo por *"${project.title}"*.\n\n` +
        `Para arrancar/avanzar con la edición sin retrasar la entrega, me faltaría recibir:\n` +
        `${missingFiles || '• Archivos en bruto del proyecto'}\n\n` +
        (project.links.drive
          ? `📂 Puedes subirlos directamente aquí:\n${project.links.drive}\n\n`
          : '') +
        `¡Apenas estén listos me avisas!`,
    },
    {
      id: 'in_editing',
      label: 'Avisar que entró a edición',
      badge: 'En timeline',
      buildMessage: () =>
        `${greeting} Te aviso que ya estoy editando *"${project.title}"* en timeline 🎬✨.\n\n` +
        `Puedes seguir el porcentaje de avance en vivo desde tu enlace de cliente:\n${portalUrl}`,
    },
    {
      id: 'send_review',
      label: 'Enviar corte a revisión',
      badge: `Ronda ${Math.min(project.revisionsUsed + 1, Math.max(1, project.revisionsIncluded))}/${project.revisionsIncluded}`,
      buildMessage: () =>
        `${greeting} ¡Ya está lista la versión de revisión de *"${project.title}"*! 👀🎬\n\n` +
        `🔗 *Míralo aquí:* ${reviewLink}\n\n` +
        `🔄 Esta corresponde a la *Revisión ${Math.max(1, project.revisionsUsed)} de ${project.revisionsIncluded} incluidas*.\n` +
        `Por favor envíame cualquier ajuste todo junto indicando el minuto exacto (ej. 00:24 - cambiar texto) para aplicarlo rápido.`,
    },
    {
      id: 'extra_revision',
      label: 'Avisar ronda de cambios extra',
      badge: 'Extra',
      buildMessage: () =>
        `${greeting} Con gusto reviso estos nuevos cambios para *"${project.title}"* 🙌.\n\n` +
        `Te comento que ya completamos las *${project.revisionsIncluded} rondas de revisión incluidas* en el presupuesto, por lo que esta ronda adicional tendría un ajuste extra antes de renderizar. ¿Confirmas para avanzarlo hoy mismo?`,
    },
    {
      id: 'final_payment',
      label: 'Cobrar saldo final / Entrega',
      badge: pending > 0 ? `Cobrar ${settings.currency}${pending}` : 'Entrega final',
      buildMessage: () =>
        pending > 0
          ? `${greeting} ¡El master final de *"${project.title}"* ya quedó listo en máxima calidad! 🎉🎬\n\n` +
            `Queda únicamente el saldo restante de *${settings.currency}${pending.toLocaleString('es-ES')}* para liberarte la carpeta de descarga final.\n\n` +
            `Quedo atento al comprobante para enviarte el link enseguida 🙌.`
          : `${greeting} ¡Muchas gracias por tu pago! Aquí tienes el enlace final de descarga en máxima calidad de *"${project.title}"* 🎉:\n\n` +
            `📥 ${finalLink}\n\n` +
            `¡Un placer trabajar juntos!`,
    },
  ];
}

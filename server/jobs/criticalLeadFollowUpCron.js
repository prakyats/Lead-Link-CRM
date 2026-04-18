const cron = require('node-cron');
const prisma = require('../utils/prisma');
const { sendEmail } = require('../services/mailer');

function isEnabled() {
  return (process.env.ENABLE_CRITICAL_LEAD_EMAILS || '').toLowerCase() === 'true';
}

function getCronExpr() {
  // Default: every day at 9:00 AM server local time
  return process.env.CRITICAL_LEAD_CRON || '0 9 * * *';
}

function formatDateTime(dt) {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt);
  }
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function buildEmail({ lead, tasks, frontendBaseUrl }) {
  const leadUrl = frontendBaseUrl ? `${frontendBaseUrl.replace(/\/$/, '')}/leads/${lead.id}` : null;

  const title = `Critical follow-up needed: ${lead.company}`;
  const lines = [
    `Company: ${lead.company}`,
    `Contact: ${lead.contactName || '—'}`,
    `Email: ${lead.email || '—'}`,
    `Phone: ${lead.phone || '—'}`,
    `Priority: ${lead.priority}`,
    `Stage: ${lead.stage}`,
    `Value: ${lead.value}`,
    `Last interaction: ${formatDateTime(lead.lastInteraction)}`,
    leadUrl ? `Lead: ${leadUrl}` : null,
    '',
    `Pending follow-ups (due soon/overdue):`,
    ...tasks.map(t => `- ${t.title} (due ${formatDateTime(t.dueDate)})`)
  ].filter(Boolean);

  const htmlTasks = tasks.map(t => (
    `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;">${escapeHtml(t.title)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;white-space:nowrap;">${escapeHtml(formatDateTime(t.dueDate))}</td>
    </tr>`
  )).join('');

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.5;color:#111">
      <h2 style="margin:0 0 12px 0">${escapeHtml(title)}</h2>
      <p style="margin:0 0 14px 0;color:#444">
        This lead is marked critical and has follow-ups that are due.
      </p>

      <div style="padding:12px 14px;border:1px solid #e8e8e8;border-radius:12px;background:#fafafa">
        <div><b>Company:</b> ${escapeHtml(lead.company)}</div>
        <div><b>Contact:</b> ${escapeHtml(lead.contactName || '—')}</div>
        <div><b>Email:</b> ${escapeHtml(lead.email || '—')}</div>
        <div><b>Phone:</b> ${escapeHtml(lead.phone || '—')}</div>
        <div><b>Priority:</b> ${escapeHtml(lead.priority)}</div>
        <div><b>Stage:</b> ${escapeHtml(lead.stage)}</div>
        <div><b>Value:</b> ${escapeHtml(String(lead.value ?? '—'))}</div>
        <div><b>Last interaction:</b> ${escapeHtml(formatDateTime(lead.lastInteraction))}</div>
        ${leadUrl ? `<div style="margin-top:8px"><a href="${leadUrl}">Open lead in CRM</a></div>` : ''}
      </div>

      <h3 style="margin:18px 0 8px 0">Follow-ups</h3>
      <table style="border-collapse:collapse;width:100%;border:1px solid #eee;border-radius:12px;overflow:hidden">
        <thead>
          <tr style="background:#f2f2f2">
            <th align="left" style="padding:10px;border-bottom:1px solid #eee">Task</th>
            <th align="left" style="padding:10px;border-bottom:1px solid #eee">Due</th>
          </tr>
        </thead>
        <tbody>${htmlTasks}</tbody>
      </table>

      <p style="margin:16px 0 0 0;color:#666;font-size:12px">
        Sent by LeadLinkCRM scheduler.
      </p>
    </div>
  `;

  return { subject: title, text: lines.join('\n'), html };
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function runOnce() {
  const now = new Date();
  const soonWindowHours = parseInt(process.env.CRITICAL_LEAD_FOLLOWUP_WINDOW_HOURS || '24', 10);
  const dueBefore = new Date(now.getTime() + soonWindowHours * 60 * 60 * 1000);

  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // "Critical" definition:
  // - Lead priority HIGH OR no interaction in 7+ days (riskCalculator "high")
  // AND has at least one pending task due within window (overdue or soon)
  // AND not closed
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const leads = await prisma.lead.findMany({
    where: {
      stage: { notIn: ['CONVERTED', 'LOST'] },
      OR: [
        { priority: 'HIGH' },
        { lastInteraction: { lt: sevenDaysAgo } },
        { lastInteraction: null }
      ],
      tasks: {
        some: {
          status: 'PENDING',
          dueDate: { not: null, lte: dueBefore }
        }
      }
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          manager: { select: { id: true, name: true, email: true, role: true } }
        }
      },
      tasks: {
        where: { status: 'PENDING', dueDate: { not: null, lte: dueBefore } },
        orderBy: { dueDate: 'asc' },
        take: 10
      }
    }
  });

  if (!leads.length) return { emailed: 0, leads: 0 };

  let emailed = 0;

  for (const lead of leads) {
    const recipients = uniq([
      lead.assignedTo?.email,
      lead.assignedTo?.manager?.email
    ]);

    if (!recipients.length) continue;

    const { subject, html, text } = buildEmail({
      lead,
      tasks: lead.tasks || [],
      frontendBaseUrl
    });

    try {
      await sendEmail({ to: recipients.join(','), subject, html, text });
      emailed += 1;
    } catch (err) {
      console.error('❌ Failed sending critical lead email', { leadId: lead.id, err: err?.message || err });
    }
  }

  return { emailed, leads: leads.length };
}

function startCriticalLeadFollowUpCron() {
  if (!isEnabled()) {
    console.log('ℹ️  Critical lead email cron disabled (set ENABLE_CRITICAL_LEAD_EMAILS=true to enable)');
    return null;
  }

  const expr = getCronExpr();
  if (!cron.validate(expr)) {
    console.error(`❌ Invalid CRITICAL_LEAD_CRON expression: ${expr}`);
    return null;
  }

  console.log(`⏱️  Critical lead follow-up email cron scheduled: ${expr}`);

  const task = cron.schedule(expr, async () => {
    try {
      const { emailed, leads } = await runOnce();
      console.log(`📧 Critical lead emails sent: ${emailed} (leads matched: ${leads})`);
    } catch (err) {
      console.error('❌ Critical lead cron failed:', err?.message || err);
    }
  });

  return task;
}

module.exports = { startCriticalLeadFollowUpCron, runOnce };


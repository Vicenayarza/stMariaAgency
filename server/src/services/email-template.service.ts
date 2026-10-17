
type EmailTemplateParams = {
  title: string;
  greeting?: string;
  paragraphs: string[];
  details?: Array<{
    label: string;
    value: string | null | undefined;
  }>;
  button?: {
    label: string;
    url: string;
  };
  footerNote?: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function buildEmailTemplate({
  title,
  greeting,
  paragraphs,
  details = [],
  button,
  footerNote,
}: EmailTemplateParams): {
  html: string;
  text: string;
} {
  const logoUrl = process.env.MAIL_LOGO_URL;

  const safeLogoUrl =
    logoUrl?.startsWith("https://")
      ? safeHttpUrl(logoUrl)
      : null;

  const safeButtonUrl = button
    ? safeHttpUrl(button.url)
    : null;

  const logoHtml = safeLogoUrl
    ? `
      <img
        src="${escapeHtml(safeLogoUrl)}"
        alt="ST.MARY Agency"
        width="170"
        style="display:block;width:170px;max-width:100%;height:auto;"
      />
    `
    : `
      <span style="
        font-size:21px;
        font-weight:700;
        letter-spacing:-0.7px;
        color:#5A3E28;
      ">
        ST.MARY AGENCY
      </span>
    `;

  const paragraphsHtml = paragraphs
    .map(
      (paragraph) => `
        <p style="
          margin:0 0 18px;
          font-size:15px;
          line-height:1.8;
          color:#6F6052;
        ">
          ${escapeHtml(paragraph)}
        </p>
      `
    )
    .join("");

  const detailsHtml =
    details.length > 0
      ? `
        <div style="
          margin:28px 0;
          padding:22px;
          border:1px solid #D8C3A5;
          border-radius:12px;
          background-color:#FFFFFF;
        ">
          ${details
            .map(
              ({ label, value }) => `
                <div style="
                  padding:10px 0;
                  border-bottom:1px solid #F4EDE2;
                ">
                  <div style="
                    margin-bottom:5px;
                    font-size:11px;
                    font-weight:700;
                    letter-spacing:1px;
                    text-transform:uppercase;
                    color:#8A6340;
                  ">
                    ${escapeHtml(label)}
                  </div>

                  <div style="
                    font-size:14px;
                    line-height:1.6;
                    color:#3E2B1B;
                    overflow-wrap:anywhere;
                  ">
                    ${escapeHtml(value || "-")}
                  </div>
                </div>
              `
            )
            .join("")}
        </div>
      `
      : "";

  const buttonHtml =
    button && safeButtonUrl
      ? `
        <div style="margin:32px 0;text-align:center;">
          <a
            href="${escapeHtml(safeButtonUrl)}"
            style="
              display:inline-block;
              padding:16px 30px;
              background-color:#5A3E28;
              border-radius:30px;
              color:#FFFFFF;
              font-size:13px;
              font-weight:700;
              text-decoration:none;
              letter-spacing:0.4px;
            "
          >
            ${escapeHtml(button.label)}
          </a>
        </div>
      `
      : "";

  const footerNoteHtml = footerNote
    ? `
      <p style="
        margin:25px 0 0;
        font-size:12px;
        line-height:1.7;
        color:#8A6340;
      ">
        ${escapeHtml(footerNote)}
      </p>
    `
    : "";

  const html = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
      </head>

      <body style="
        margin:0;
        padding:0;
        background-color:#F4EDE2;
        font-family:Arial,Helvetica,sans-serif;
      ">
        <div style="padding:40px 16px;">
          <div style="
            max-width:600px;
            margin:0 auto;
            overflow:hidden;
            background-color:#FFFFFF;
            border:1px solid #D8C3A5;
            border-radius:18px;
          ">
            <!-- CABECERA -->
            <div style="
              padding:32px;
              background-color:#F4EDE2;
              border-bottom:1px solid #D8C3A5;
            ">
              ${logoHtml}

              <p style="
                margin:14px 0 0;
                font-size:10px;
                letter-spacing:2px;
                text-transform:uppercase;
                color:#8A6340;
              ">
                Influencer Marketing
              </p>
            </div>

            <!-- CONTENIDO -->
            <div style="padding:36px 32px;">
              <h1 style="
                margin:0 0 24px;
                font-size:28px;
                line-height:1.2;
                font-weight:600;
                letter-spacing:-1px;
                color:#3E2B1B;
              ">
                ${escapeHtml(title)}
              </h1>

              ${
                greeting
                  ? `
                    <p style="
                      margin:0 0 20px;
                      font-size:16px;
                      font-weight:600;
                      color:#3E2B1B;
                    ">
                      ${escapeHtml(greeting)}
                    </p>
                  `
                  : ""
              }

              ${paragraphsHtml}
              ${detailsHtml}
              ${buttonHtml}
              ${footerNoteHtml}
            </div>

            <!-- PIE -->
            <div style="
              padding:26px 32px;
              background-color:#F4EDE2;
              border-top:1px solid #D8C3A5;
              text-align:center;
            ">
              <p style="
                margin:0 0 12px;
                font-size:12px;
                color:#6F6052;
              ">
                Equipo ST.MARY Agency
              </p>

              <a
                href="https://stmaryagency.com"
                style="
                  font-size:12px;
                  color:#5A3E28;
                  text-decoration:none;
                "
              >
                stmaryagency.com
              </a>

              <p style="
                margin:16px 0 0;
                font-size:11px;
                color:#8A6340;
              ">
                © ${new Date().getFullYear()} ST.MARY Agency
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = [
    title,
    "",
    ...(greeting ? [greeting, ""] : []),
    ...paragraphs.flatMap((paragraph) => [
      paragraph,
      "",
    ]),
    ...details.map(
      ({ label, value }) => `${label}: ${value || "-"}`
    ),
    ...(button && safeButtonUrl
      ? ["", button.label, safeButtonUrl]
      : []),
    ...(footerNote ? ["", footerNote] : []),
    "",
    "Equipo ST.MARY Agency",
    "https://stmaryagency.com",
  ].join("\n");

  return { html, text };
}

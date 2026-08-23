package com.interview.auth.mail;

public final class EmailTemplates {

    private EmailTemplates() {}

    public static final String MARK_CID = "tyyari-mark";

    public static String page(
            String kicker,
            String title,
            String body,
            String ctaLabel,
            String ctaUrl,
            String footnote
    ) {
        return page(kicker, title, body, ctaLabel, ctaUrl, footnote, null);
    }

    public static String page(
            String kicker,
            String title,
            String body,
            String ctaLabel,
            String ctaUrl,
            String footnote,
            String homeUrl
    ) {
        String button = isBlank(ctaLabel) || isBlank(ctaUrl)
                ? ""
                : """
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px">
                    <tr>
                      <td style="border-radius:12px;background:#f97316">
                        <a href="%s" style="display:inline-block;padding:12px 20px;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none">%s</a>
                      </td>
                    </tr>
                  </table>
                  """.formatted(escapeAttr(ctaUrl), escape(ctaLabel));
        String note = isBlank(footnote)
                ? ""
                : "<p style=\"margin:16px 0 0;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:#94a3b8\">"
                + escape(footnote)
                + "</p>";
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width,initial-scale=1">
                  <meta name="color-scheme" content="light">
                  <meta name="theme-color" content="#f97316">
                  <title>%s</title>
                  <link rel="preconnect" href="https://fonts.googleapis.com">
                  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
                </head>
                <body style="margin:0;padding:0;background:#f8fafc">
                  <div style="display:none;max-height:0;overflow:hidden;opacity:0">%s</div>
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f8fafc">
                    <tr>
                      <td align="center" style="padding:36px 16px">
                        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%%;max-width:560px">
                          <tr>
                            <td style="padding:0 8px 20px">
                              %s
                            </td>
                          </tr>
                          <tr>
                            <td style="background:#ffffff;border:1px solid rgba(249,115,22,0.25);border-radius:28px;padding:32px 28px;background-image:radial-gradient(220px 140px at 100%% 0,rgba(249,115,22,0.16),transparent 58%%),radial-gradient(200px 120px at 0 100%%,rgba(37,99,235,0.08),transparent 55%%)">
                              <p style="margin:0;font-family:Caveat,cursive;font-size:26px;line-height:1;font-weight:700;color:#f97316">%s</p>
                              <h1 style="margin:8px 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:1.15;font-weight:800;letter-spacing:-0.03em;color:#0f172a">%s</h1>
                              <p style="margin:14px 0 0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:24px;color:#64748b">%s</p>
                              %s
                              %s
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#94a3b8">
                              <img src="cid:tyyari-mark" width="18" height="18" alt="" style="display:inline-block;border:0;width:18px;height:18px;border-radius:5px;vertical-align:middle;margin-right:6px">
                              Tyyari · SDE interview prep<br>
                              Same library. Same orange.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                escape(title),
                escape(isBlank(body) ? title : body),
                logo(homeUrl),
                escape(kicker),
                escape(title),
                escape(body),
                button,
                note
        );
    }

    public static String greeting(String name) {
        return isBlank(name) ? "" : "Hi " + name.trim() + ". ";
    }

    private static String logo(String homeUrl) {
        String mark = """
                <img src="cid:%s" width="32" height="32" alt="Tyyari" style="display:block;border:0;width:32px;height:32px;border-radius:9px;outline:none">
                """.formatted(MARK_CID);
        String wordmark = """
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle">%s</td>
                    <td style="padding-left:8px;font-family:Inter,Arial,sans-serif;font-size:17px;font-weight:800;letter-spacing:-0.03em;color:#0f172a;vertical-align:middle">Tyyari</td>
                  </tr>
                </table>
                """.formatted(mark);
        if (isBlank(homeUrl)) {
            return wordmark;
        }
        return "<a href=\"%s\" style=\"text-decoration:none\">%s</a>".formatted(escapeAttr(homeUrl), wordmark);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private static String escapeAttr(String value) {
        return escape(value).replace("'", "&#39;");
    }
}

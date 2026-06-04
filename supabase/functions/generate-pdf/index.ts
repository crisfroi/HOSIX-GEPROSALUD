import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { chromium } from "https://deno.land/x/playwright_core@1.40.0/mod.ts";

interface GeneratePdfRequest {
  html: string;
  filename?: string;
  format?: "A4" | "Letter";
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const request: GeneratePdfRequest = await req.json();
    
    if (!request.html) {
      return new Response("HTML content is required", { status: 400 });
    }

    // Inyectar CSS para paginación correcta
    const htmlWithStyles = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            page-break-inside: avoid;
          }
          @page {
            size: ${request.format || "A4"};
            margin: ${request.margin?.top || "2cm"} 
                    ${request.margin?.right || "2cm"} 
                    ${request.margin?.bottom || "2cm"} 
                    ${request.margin?.left || "2cm"};
          }
          /* Evitar que párrafos se corten */
          p, .field-group, .section {
            break-inside: avoid;
            orphans: 3;
            widows: 3;
          }
          /* Tablas no se dividen */
          table, tr, td {
            break-inside: avoid;
          }
          /* Encabezados en página nueva */
          h2, h3 {
            break-after: avoid;
            break-before: auto;
            page-break-inside: avoid;
          }
          /* Secciones comienzan en página nueva */
          .section-break {
            break-after: always;
          }
          /* Estilos de tabla */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 1cm 0;
          }
          th, td {
            border: 1px solid #999;
            padding: 0.5cm;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          /* Pie de página y encabezado */
          .header, .footer {
            position: fixed;
            width: 100%;
            background-color: #f9f9f9;
            border-bottom: 1px solid #ddd;
            padding: 0.5cm;
            font-size: 0.8em;
          }
          .header {
            top: 0;
            margin-top: -2cm;
          }
          .footer {
            bottom: 0;
            margin-bottom: -2cm;
            border-top: 1px solid #ddd;
            border-bottom: none;
          }
          /* Logo y estilo profesional */
          .logo {
            max-width: 3cm;
            margin-bottom: 0.5cm;
          }
          .title {
            text-align: center;
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 1cm;
            page-break-after: avoid;
          }
          .info-box {
            border: 1px solid #ddd;
            padding: 0.5cm;
            margin: 0.5cm 0;
            background-color: #fafafa;
            break-inside: avoid;
          }
          .firma-line {
            border-top: 1px solid #000;
            margin-top: 1cm;
            padding-top: 0.2cm;
            margin-bottom: 0;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        ${request.html}
      </body>
      </html>
    `;

    // Lanzar Chromium
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Cargar HTML
    await page.setContent(htmlWithStyles, { waitUntil: "networkidle" });

    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: request.format || "A4",
      margin: {
        top: request.margin?.top || "2cm",
        right: request.margin?.right || "2cm",
        bottom: request.margin?.bottom || "2cm",
        left: request.margin?.left || "2cm",
      },
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${request.filename || 'documento.pdf'}"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});

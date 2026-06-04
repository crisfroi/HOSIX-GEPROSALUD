import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface GenerateDocxRequest {
  titulo: string;
  subtitulo?: string;
  datos: Record<string, any>;
  tablas?: Array<{
    titulo: string;
    columnas: string[];
    filas: Array<Record<string, any>>;
  }>;
  plantilla_tipo: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const request: GenerateDocxRequest = await req.json();

    if (!request.titulo || !request.datos) {
      return new Response("Título y datos son requeridos", { status: 400 });
    }

    // Usar librería docx via npm/cdn
    // Para producción, usar: npm install docx
    // Aquí simulamos la generación en base64

    const docxContent = generateDocxContent(request);
    const docxBuffer = Buffer.from(docxContent, 'base64');

    return new Response(docxBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${request.titulo.replace(/\s+/g, '_')}.docx"`,
      },
    });
  } catch (error) {
    console.error("Error generating DOCX:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});

// Función auxiliar para generar contenido DOCX básico
function generateDocxContent(request: GenerateDocxRequest): string {
  // En producción, usar la librería docx completa
  // Este es un ejemplo simplificado
  
  const xmlContent = `
    <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <w:body>
        <!-- Título -->
        <w:p>
          <w:pPr>
            <w:pStyle w:val="Heading1"/>
            <w:keepNext/>
            <w:keepLines/>
            <w:jc w:val="center"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:b/>
              <w:sz w:val="28"/>
            </w:rPr>
            <w:t>${escapeXml(request.titulo)}</w:t>
          </w:r>
        </w:p>
        
        <!-- Subtítulo -->
        ${request.subtitulo ? `
        <w:p>
          <w:pPr>
            <w:keepNext/>
            <w:jc w:val="center"/>
          </w:pPr>
          <w:r>
            <w:t>${escapeXml(request.subtitulo)}</w:t>
          </w:r>
        </w:p>
        ` : ''}
        
        <!-- Datos -->
        ${Object.entries(request.datos).map(([clave, valor]) => `
        <w:p>
          <w:pPr>
            <w:keepNext/>
            <w:cantSplit/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:b/>
            </w:rPr>
            <w:t>${escapeXml(clave)}:</w:t>
          </w:r>
          <w:r>
            <w:t xml:space="preserve"> ${escapeXml(String(valor || ''))}</w:t>
          </w:r>
        </w:p>
        `).join('')}
        
        <!-- Tablas -->
        ${request.tablas?.map(tabla => `
        <w:p>
          <w:pPr>
            <w:keepNext/>
            <w:pStyle w:val="Heading2"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:b/>
            </w:rPr>
            <w:t>${escapeXml(tabla.titulo)}</w:t>
          </w:r>
        </w:p>
        
        <w:tbl>
          <w:tblPr>
            <w:tblW w:w="5000" w:type="auto"/>
            <w:tblBorders>
              <w:top w:val="single" w:sz="12" w:space="0" w:color="000000"/>
              <w:left w:val="single" w:sz="12" w:space="0" w:color="000000"/>
              <w:bottom w:val="single" w:sz="12" w:space="0" w:color="000000"/>
              <w:right w:val="single" w:sz="12" w:space="0" w:color="000000"/>
              <w:insideH w:val="single" w:sz="12" w:space="0" w:color="000000"/>
              <w:insideV w:val="single" w:sz="12" w:space="0" w:color="000000"/>
            </w:tblBorders>
          </w:tblPr>
          
          <!-- Encabezado -->
          <w:tr>
            <w:trPr>
              <w:cantSplit/>
            </w:trPr>
            ${tabla.columnas.map(col => `
            <w:tc>
              <w:tcPr>
                <w:shd w:fill="F0F0F0"/>
              </w:tcPr>
              <w:p>
                <w:r>
                  <w:rPr>
                    <w:b/>
                  </w:rPr>
                  <w:t>${escapeXml(col)}</w:t>
                </w:r>
              </w:p>
            </w:tc>
            `).join('')}
          </w:tr>
          
          <!-- Filas -->
          ${tabla.filas.map(fila => `
          <w:tr>
            <w:trPr>
              <w:cantSplit/>
            </w:trPr>
            ${tabla.columnas.map(col => `
            <w:tc>
              <w:p>
                <w:r>
                  <w:t>${escapeXml(String(fila[col] || ''))}</w:t>
                </w:r>
              </w:p>
            </w:tc>
            `).join('')}
          </w:tr>
          `).join('')}
        </w:tbl>
        `).join('')}
        
      </w:body>
    </w:document>
  `;

  // Convertir a base64 para retornar
  return Buffer.from(xmlContent).toString('base64');
}

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ══════════════════════════════════════════════════════════════════
//  cotizador.js — Lógica de generación de PDF en el navegador
//  The Cool Hostel — Compatible 100% con GitHub Pages (Client-side)
// ══════════════════════════════════════════════════════════════════

'use strict';

// ── PALETAS DE COLOR ───────────────────────────────────────────
const PALETAS = {
  rosado:   { principal: '#f08484', expBg: '#f08484', expText: 'white', optColor: '#f08484' },
  amarillo: { principal: '#f5c842', expBg: '#333333', expText: 'white', optColor: '#f5c842' },
  azul:     { principal: '#4a90d9', expBg: '#333333', expText: 'white', optColor: '#4a90d9' },
};

// ── PRESETS DE OPCIONES ────────────────────────────────────────
const COT_OPCIONES = {
  desayuno: `OPCIÓN DESAYUNO\n( R E C O M E N D A D A )\n\n• Desayuno diario grupal.\n• Huevos revueltos (preparados al momento).\n• Tostadas con mantequilla y mermelada.\n• Palta fresca.\n• Café en grano o té.`,
  rest_simple: `OPCIÓN ALIMENTACIÓN\nEN RESTAURANTES ASOCIADOS\n\nServicio buffet alimentación\n• Desayuno: 08:00 - 11:00 am\n• Incluye 1 bebestible por persona.`,
  rest_completa: `OPCIÓN ALIMENTACIÓN\nEN RESTAURANTES ASOCIADOS\n\n• Servicio buffet alimentación diaria (desayuno, almuerzo y cena).\n• Desayuno: 08:00 - 11:00 am\n• Almuerzo / Cena: 12:00 - 23:30 pm\n• Incluye 1 bebestible por persona.`,
  conectividad: `CONECTIVIDAD & ACCESO\n( T O D O  A  T U  D I S P O S I C I Ó N )\n\n• Comedor amplio para el grupo\n• Acceso a Salón de Entretenimiento.\n• Sesiones de Yoga y Pilates.\n• Clases de Surf disponible\n• Cercanía a comercios`,
  invitados: `ALOJAMIENTO PARA INVITADOS\n\nOpción de hospedaje para quienes deseen quedarse después del evento:\n\n• Valor preferencial desde $15.000 + IVA por persona\n• Alojamiento cómodos y funcionales para descanso\n• Cercanía a comercios`
};

// ── HELPERS DE FECHA ───────────────────────────────────────────
function parseFecha(f) {
  if (!f) return null;
  let dia, mes, anio;
  if (f.includes('/')) [dia, mes, anio] = f.split('/');
  else if (f.includes('-')) [anio, mes, dia] = f.split('-');
  else return null;
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
                 'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return { dia: parseInt(dia, 10), mes: meses[parseInt(mes, 10) - 1], anio };
}

function formatRangoFechas(fi, ff) {
  const i = parseFecha(fi);
  const f = parseFecha(ff);
  if (!i || !f) return `${fi || ''} al ${ff || ''}`;
  if (i.mes === f.mes && i.anio === f.anio)
    return `del ${i.dia} al ${f.dia} de ${f.mes} ${f.anio}`;
  if (i.anio === f.anio)
    return `del ${i.dia} de ${i.mes} al ${f.dia} de ${f.mes} ${f.anio}`;
  return `del ${i.dia} de ${i.mes} ${i.anio} al ${f.dia} de ${f.mes} ${f.anio}`;
}

// ── CONSTRUCTOR DEL HTML PARA EL PDF ───────────────────────────
function buildCotizacionHTML(d, paleta, logoB64, filas, totalGrupal) {
  const pasajeros = d.pasajeros || d['total pasajeros'] || d.total_pasajeros || '';
  const noches    = d.noches    || d['noches de estadia'] || d.noches_estadia || '';
  const adultosTxt = d.adultos ? ` (${d.adultos} adultos)` : '';
  const pasajerosTxt = pasajeros ? `${pasajeros} huéspedes${adultosTxt}` : '';
  const opcionTitulo = d.opcion ? ` - ${d.opcion}` : '';

  return `
  <div class="pdf-container-root">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Montserrat:wght@700;800&display=swap');
      .pdf-container-root {
        font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 13px;
        background: #e8e8e8;
        padding: 55px 32px 25px 32px;
        box-sizing: border-box;
        color: #222;
        width: 794px;
        margin: 0 auto;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .pdf-header { text-align: center; margin-bottom: 12px; }
      .pdf-header img { max-width: 460px; width: 100%; display: block; margin: 0 auto; }
      .pdf-main { background: white; border-radius: 10px 10px 0 0; padding: 18px 22px 4px 22px; margin-bottom: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
      .pdf-title { font-family: 'Montserrat', sans-serif; font-size: 20px; font-weight: 800; color: #222; margin-bottom: 6px; }
      .pdf-title span { font-weight: 400; font-size: 18px; color: #444; }
      .pdf-subtitle { font-size: 16px; font-weight: 700; color: #222; margin-bottom: 2px; }
      .pdf-info { font-size: 15px; color: #444; margin-bottom: 2px; padding-left: 12px; }
      .pdf-table { width: calc(100% + 44px); border-collapse: collapse; margin-top: 10px; font-size: 13px; margin-left: -22px; margin-right: -22px; }
      .pdf-table th { font-size: 13px; font-weight: 700; padding: 7px 22px; border-top: 1.5px solid #ddd; border-bottom: 1.5px solid #ddd; color: #222; }
      .pdf-table th:first-child { text-align: left; }
      .pdf-table th:nth-child(2) { text-align: center; border-left: 1.5px solid #ddd; border-right: 1.5px solid #ddd; width: 90px; }
      .pdf-table th:last-child { text-align: right; }
      .pdf-table td { padding: 6px 22px; color: #333; }
      .pdf-table td:first-child { text-align: left; }
      .pdf-table td:nth-child(2) { text-align: center; border-left: 1.5px solid #ddd; border-right: 1.5px solid #ddd; }
      .pdf-table td:last-child { text-align: right; }
      .pdf-table tbody tr:nth-child(odd) { background: #f7f7f7; }
      .pdf-table tbody tr:nth-child(even) { background: #fff; }
      .pdf-total-wrap { display: flex; justify-content: flex-end; margin-bottom: 14px; }
      .pdf-total-box { background: #222; border-radius: 0 0 8px 8px; padding: 9px 16px 9px 22px; font-weight: 700; font-size: 14px; color: white; display: inline-flex; justify-content: space-between; width: 58%; box-sizing: border-box; }
      .pdf-middle { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 0; padding: 0 38px; }
      .pdf-exp { background: ${paleta.expBg}; border-radius: 10px; padding: 16px; color: ${paleta.expText}; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
      .pdf-exp h3 { font-size: 15px; font-weight: 800; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px; text-align: center; font-family: 'Montserrat', sans-serif; }
      .pdf-exp-div { height: 2px; background: rgba(255,255,255,0.35); margin-bottom: 8px; }
      .pdf-opt { background: white; border-radius: 10px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
      .pdf-bottom { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 14px; padding: 0 38px; }
      .pdf-card { background: white; border-radius: 10px; padding: 14px 14px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
      .pdf-card h4 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px; color: #222; }
      .pdf-hl { color: ${paleta.principal}; }
      .pdf-card p { font-size: 12px; color: #444; margin: 3px 0; line-height: 1.6; }
    </style>
    
    <div class="pdf-header">
      <img src="data:image/png;base64,${logoB64}" alt="The Cool Hostel">
    </div>
    
    <div class="pdf-main">
      <div class="pdf-title">COTIZACIÓN GRUPAL <span>${escapeHtml(opcionTitulo)}</span></div>
      <div class="pdf-subtitle">Grupo: ${escapeHtml(d.nombre_grupo || '')}</div>
      <div class="pdf-info">Fechas: ${formatRangoFechas(d.fecha_inicio, d.fecha_fin)} (${noches} noches)</div>
      ${pasajerosTxt ? `<div class="pdf-info">${escapeHtml(pasajerosTxt)}</div>` : ''}
      <table class="pdf-table">
        <thead>
          <tr><th>Tipo Alojamiento</th><th>Personas</th><th>Total</th></tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
    </div>

    <div class="pdf-total-wrap">
      <div class="pdf-total-box">
        <span>TOTAL ESTADÍA GRUPAL:</span>
        <span>${totalGrupal ? '$' + Number(totalGrupal).toLocaleString('es-CL') : '$0'}</span>
      </div>
    </div>

    <div class="pdf-middle">
      <div class="pdf-exp">
        <h3>Tu experiencia incluye:</h3>
        <div class="pdf-exp-div"></div>
        <div style="font-size:13px;line-height:1.8;white-space:pre-line;">${escapeHtml(d.experiencia || '')}</div>
      </div>
      <div class="pdf-opt">
        <div style="font-size:13px;line-height:1.8;white-space:pre-line;">${escapeHtml(d.opcion_texto || '')}</div>
      </div>
    </div>

    <div class="pdf-bottom">
      <div class="pdf-card">
        <h4>MÉTODO <span class="pdf-hl">DE PAGO</span></h4>
        <div style="font-size:12px;color:#444;line-height:1.6;white-space:pre-line;">${escapeHtml(d.pago || 'Transferencia o Link de Pago\ninfo@thecoolhostel.cl\n+56 9 4846 5248')}</div>
      </div>
      <div class="pdf-card">
        <h4>POLÍTICA <span class="pdf-hl">DE RESERVA</span></h4>
        <div style="font-size:12px;color:#444;line-height:1.6;white-space:pre-line;">${escapeHtml(d.politica || '✓ Tarifa grupal especial\n✓ Abono del 50% confirma la reserva')}</div>
      </div>
      <div class="pdf-card">
        <h4>PRÓXIMO <span class="pdf-hl">PASO</span></h4>
        <div style="font-size:12px;color:#444;line-height:1.6;white-space:pre-line;">${escapeHtml(d.proximo || 'Se requiere un depósito en garantía de $100.000 reembolsable al realizar el check-out, sujeto a la entrega de las instalaciones en buen estado.')}</div>
      </div>
    </div>
  </div>`;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── CÁLCULO DE SERVICIOS Y TOTALES ─────────────────────────────
function procesarServiciosParaPDF(servicios) {
  let filas = '';
  let subtotal = 0;
  let totalGrupal = 0;

  (servicios || []).forEach(s => {
    const servicio = (s.servicio || '').trim();
    const personas = (s.personas || '').trim();
    const precioRaw = String(s.precio || '').replace(/\./g, '').replace(/,/g, '.').trim();

    if (!servicio) return;

    if (/impuesto/i.test(servicio)) {
      const imp = Math.round(subtotal * 0.19);
      totalGrupal += imp;
      filas += `<tr><td>${escapeHtml(servicio)}</td><td>-</td><td>$${imp.toLocaleString('es-CL')}</td></tr>`;
    } else if (precioRaw) {
      const pNum = Number(precioRaw) || 0;
      subtotal += pNum;
      totalGrupal += pNum;
      const pLabel = personas && personas !== '-' && personas !== '0' ? escapeHtml(personas) : '-';
      filas += `<tr><td>${escapeHtml(servicio)}</td><td>${pLabel}</td><td>$${pNum.toLocaleString('es-CL')}</td></tr>`;
    }
  });

  return { filas, totalGrupal };
}

// ── GENERADOR CLIENT-SIDE GARANTIZADO DE 1 PÁGINA (html2canvas + jsPDF) ─
async function generarPDFDocumento(payload, tipoFormato = 'auto') {
  const paleta = PALETAS[(payload.color || 'rosado').toLowerCase()] || PALETAS.rosado;
  const { filas, totalGrupal } = procesarServiciosParaPDF(payload._servicios || []);
  const logo = (typeof LOGO_BASE64 !== 'undefined') ? LOGO_BASE64 : '';

  const htmlContent = buildCotizacionHTML(payload, paleta, logo, filas, totalGrupal);

  // Crear contenedor temporal renderizado de forma visible para el motor pero fuera del foco del usuario
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'fixed';
  tempDiv.style.left = '0';
  tempDiv.style.top = '0';
  tempDiv.style.zIndex = '-9999';
  tempDiv.style.opacity = '0.01';
  tempDiv.style.pointerEvents = 'none';
  tempDiv.style.width = '794px';
  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);

  try {
    // 1. Asegurar carga de fuentes web
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // 2. Asegurar decodificación completa del logo
    const imgLogo = tempDiv.querySelector('.pdf-header img');
    if (imgLogo) {
      if (!imgLogo.complete) {
        await new Promise(r => { imgLogo.onload = r; imgLogo.onerror = r; });
      }
      if (imgLogo.decode) {
        try { await imgLogo.decode(); } catch(e) {}
      }
    }

    // Pequeño retardo para asegurar pintura completa de estilos
    await new Promise(r => setTimeout(r, 60));

    const targetElement = tempDiv.firstElementChild;
    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#e8e8e8',
      width: 794,
      windowWidth: 794
    });

    const jsPDFClass = window.jspdf?.jsPDF || window.jsPDF;
    if (!jsPDFClass) {
      throw new Error('Librería jsPDF no disponible.');
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    let pdf;

    if (tipoFormato === 'a4') {
      // Modo A4 Estándar (595.28 x 841.89 pt) — Escalado proporcional para caber en 1 sola hoja de papel
      const a4W = 595.28;
      const a4H = 841.89;
      // Margen de seguridad de 20pt
      const maxW = a4W - 40;
      const maxH = a4H - 40;
      const scale = Math.min(maxW / canvas.width, maxH / canvas.height);
      const printW = canvas.width * scale;
      const printH = canvas.height * scale;
      const offsetX = (a4W - printW) / 2;
      const offsetY = (a4H - printH) / 2;

      pdf = new jsPDFClass({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      pdf.addImage(imgData, 'JPEG', offsetX, offsetY, printW, printH);
    } else {
      // Modo Continuo Exacto (Idéntico a Puppeteer: ancho 794pt y alto según el contenido sin cortes)
      const pdfWidth = 794;
      const pdfHeight = Math.round((canvas.height * pdfWidth) / canvas.width);

      pdf = new jsPDFClass({
        orientation: 'portrait',
        unit: 'pt',
        format: [pdfWidth, pdfHeight]
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    return pdf;
  } finally {
    document.body.removeChild(tempDiv);
  }
}

async function descargarPDFClientSide(payload, nombreArchivo, tipoFormato = 'auto') {
  const pdf = await generarPDFDocumento(payload, tipoFormato);
  const cleanName = (nombreArchivo || 'cotizacion').replace(/[^a-z0-9_-]/gi, '_') + '.pdf';
  pdf.save(cleanName);
  return true;
}

// ── IMPRESIÓN NATIVA (window.print con ventana limpia) ─────────
function imprimirPDFNativo(payload) {
  const paleta = PALETAS[(payload.color || 'rosado').toLowerCase()] || PALETAS.rosado;
  const { filas, totalGrupal } = procesarServiciosParaPDF(payload._servicios || []);
  const logo = (typeof LOGO_BASE64 !== 'undefined') ? LOGO_BASE64 : '';
  const htmlContent = buildCotizacionHTML(payload, paleta, logo, filas, totalGrupal);

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cotización - ${payload.nombre_grupo || 'The Cool Hostel'}</title>
        <style>
          @page { size: auto; margin: 0mm; }
          body { margin: 0; background: #e8e8e8; }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

// ── UNIR CON OTROS PDFS EN EL NAVEGADOR (PDF-Lib) ──────────────
async function unirPDFsConPDFLib(pdfBytesCotizacion, pdfsExternosBytes, outputNombre) {
  if (!window.PDFLib) {
    throw new Error('PDFLib no está disponible en la página.');
  }

  const mergedDoc = await PDFLib.PDFDocument.create();

  // 1. Agregar cotización
  if (pdfBytesCotizacion) {
    const docCot = await PDFLib.PDFDocument.load(pdfBytesCotizacion);
    const pages = await mergedDoc.copyPages(docCot, docCot.getPageIndices());
    pages.forEach(p => mergedDoc.addPage(p));
  }

  // 2. Agregar páginas de cada PDF adicional
  for (const extBytes of pdfsExternosBytes) {
    const extDoc = await PDFLib.PDFDocument.load(extBytes);
    const extPages = await mergedDoc.copyPages(extDoc, extDoc.getPageIndices());
    extPages.forEach(p => mergedDoc.addPage(p));
  }

  const mergedBytes = await mergedDoc.save();
  const blob = new Blob([mergedBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (outputNombre || 'cotizacion-unificada').replace(/[^a-z0-9_-]/gi, '_') + '.pdf';
  a.click();
  URL.revokeObjectURL(url);
}

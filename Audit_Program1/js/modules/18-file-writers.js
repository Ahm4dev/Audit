/* Audit-Plus · File writers (no libraries): ZIP + CRC32, XLSX, DOCX */

import { hub } from '../hub.js';
import { downloadBlob, logErr, sanitizeName } from '../core/01-utils-i18n-storage.js';
import { SETTINGS, audit, errMsg } from '../core/03-data-engine.js';
import { docHTML, docVars } from './17-forms-letters-reports.js';

/* ================= a10 · File writers written by hand (no libraries): ZIP (stored) + CRC32, XLSX, DOCX ================= */
const CRC_T = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(u8) {
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
const TE = new TextEncoder();
/* ZIP with "stored" entries (no compression) — valid for Office Open XML; UTF-8 names (flag bit 11) */
function zipStore(files) {
  const parts = [],
    central = [];
  let off = 0;
  const now = new Date();
  const dt = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff,
    dd = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;
  for (const f of files) {
    const name = TE.encode(f.name);
    const data = typeof f.data === 'string' ? TE.encode(f.data) : f.data;
    const crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true);
    h.setUint16(4, 20, true);
    h.setUint16(6, 0x0800, true);
    h.setUint16(8, 0, true);
    h.setUint16(10, dt, true);
    h.setUint16(12, dd, true);
    h.setUint32(14, crc, true);
    h.setUint32(18, data.length, true);
    h.setUint32(22, data.length, true);
    h.setUint16(26, name.length, true);
    h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true);
    c.setUint16(12, dt, true);
    c.setUint16(14, dd, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, data.length, true);
    c.setUint32(24, data.length, true);
    c.setUint16(28, name.length, true);
    c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), name);
    off += 30 + name.length + data.length;
  }
  const cs = central.reduce((a, b) => a + b.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, files.length, true);
  e.setUint16(10, files.length, true);
  e.setUint32(12, cs, true);
  e.setUint32(16, off, true);
  return new Blob([...parts, ...central, new Uint8Array(e.buffer)]);
}
const xmlEsc = s =>
  String(s == null ? '' : s)
    .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

/* ---------- XLSX: sheets = [{name, rows:[[v...]], widths:[n], header:true, rtl:true}] ; numbers stay numeric ---------- */
function colName(i) {
  let s = '';
  i++;
  while (i) {
    const m = (i - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}
function xlsxBlob(sheets, meta) {
  meta = meta || {};
  const ss = [],
    ssIdx = new Map();
  const si = v => {
    v = String(v);
    if (!ssIdx.has(v)) {
      ssIdx.set(v, ss.length);
      ss.push(v);
    }
    return ssIdx.get(v);
  };
  const sheetXml = sh => {
    const rows = sh.rows
      .map(
        (r, ri) =>
          `<row r="${ri + 1}">${r
            .map((v, ci) => {
              const ref = colName(ci) + (ri + 1);
              const st = ri === 0 && sh.header !== false ? ' s="1"' : '';
              if (v == null || v === '') return '';
              if (typeof v === 'number' && isFinite(v))
                return `<c r="${ref}"${ri === 0 && sh.header !== false ? ' s="1"' : ' s="2"'}><v>${v}</v></c>`;
              return `<c r="${ref}" t="s"${st}><v>${si(v)}</v></c>`;
            })
            .join('')}</row>`
      )
      .join('');
    const cols = (sh.widths || []).length
      ? `<cols>${sh.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
      : '';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetViews><sheetView workbookViewId="0"${sh.rtl !== false ? ' rightToLeft="1"' : ''}>${sh.header !== false ? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' : ''}</sheetView></sheetViews>${cols}<sheetData>${rows}</sheetData>${sh.header !== false && sh.rows.length > 1 && sh.rows[0].length ? `<autoFilter ref="A1:${colName(sh.rows[0].length - 1)}${sh.rows.length}"/>` : ''}</worksheet>`;
  };
  const names = sheets.map(
    (s, i) => sanitizeName(s.name || 'Sheet' + (i + 1), 31).replace(/[\[\]:*?\/\\]/g, '_') || 'Sheet' + (i + 1)
  );
  const files = [];
  const sx = sheets.map(sheetXml);
  files.push({
    name: '[Content_Types].xml',
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
  });
  files.push({
    name: '_rels/.rels',
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
  });
  files.push({
    name: 'docProps/core.xml',
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEsc(meta.title || 'Audit-Plus export')}</dc:title><dc:creator>${xmlEsc(meta.author || 'Audit-Plus')}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>`,
  });
  files.push({
    name: 'xl/workbook.xml',
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${xmlEsc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>${sheets.map((s, i) => (s.header !== false && s.rows.length > 1 && s.rows[0].length ? `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xmlEsc(names[i])}'!$A$1:$${colName(s.rows[0].length - 1)}$${s.rows.length}</definedName></definedNames>` : '')).find(Boolean) || ''}</workbook>`,
  });
  files.push({
    name: 'xl/_rels/workbook.xml.rels',
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId${sheets.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
  });
  files.push({
    name: 'xl/styles.xml',
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00;(#,##0.00);&quot;-&quot;"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE7EDF6"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="3"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/><xf numFmtId="164" applyNumberFormat="1"/></cellXfs></styleSheet>`,
  });
  sx.forEach((x, i) => files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: x }));
  files.push({
    name: 'xl/sharedStrings.xml',
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${ss.length}" uniqueCount="${ss.length}">${ss.map(v => `<si><t xml:space="preserve">${xmlEsc(v)}</t></si>`).join('')}</sst>`,
  });
  return new Blob([zipStore(files)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/* ---------- DOCX from simple blocks: {t:'title'|'h1'|'h2'|'h3'|'p'|'li'|'table'|'pb', text, rows} ; RTL aware ---------- */
function docxBlob(blocks, meta) {
  meta = meta || {};
  const rtl = meta.rtl !== false;
  const bidi = rtl ? '<w:bidi/>' : '';
  const rr = rtl ? '<w:rtl/>' : '';
  const run = (t, b) =>
    `<w:r><w:rPr>${b ? '<w:b/><w:bCs/>' : ''}${rr}<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/></w:rPr><w:t xml:space="preserve">${xmlEsc(t)}</w:t></w:r>`;
  const runs = t =>
    String(t)
      .split('\n')
      .map((l, i) => (i ? '<w:r><w:br/></w:r>' : '') + run(l))
      .join('');
  const P = (t, style, extra) =>
    `<w:p><w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ''}${bidi}${extra || ''}</w:pPr>${runs(t)}</w:p>`;
  const body = blocks
    .map(b => {
      if (b.t === 'pb') return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      if (b.t === 'title') return P(b.text, 'Title');
      if (b.t === 'h1') return P(b.text, 'Heading1');
      if (b.t === 'h2') return P(b.text, 'Heading2');
      if (b.t === 'h3') return P(b.text, 'Heading3');
      if (b.t === 'li') return P('• ' + b.text, null, '<w:ind w:start="360"/>');
      if (b.t === 'table') {
        const rows = b.rows || [];
        const n = Math.max(1, ...rows.map(r => r.length));
        return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/>${rtl ? '<w:bidiVisual/>' : ''}<w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(x => `<w:${x} w:val="single" w:sz="4" w:space="0" w:color="999999"/>`).join('')}</w:tblBorders></w:tblPr><w:tblGrid>${Array.from({ length: n }, () => `<w:gridCol w:w="${Math.floor(9000 / n)}"/>`).join('')}</w:tblGrid>${rows.map((r, ri) => `<w:tr>${Array.from({ length: n }, (_, ci) => `<w:tc><w:tcPr><w:tcW w:w="${Math.floor(5000 / n)}" w:type="pct"/>${ri === 0 ? '<w:shd w:val="clear" w:color="auto" w:fill="E7EDF6"/>' : ''}</w:tcPr><w:p><w:pPr>${bidi}</w:pPr>${ri === 0 ? run(r[ci] == null ? '' : String(r[ci]), true) : runs(r[ci] == null ? '' : String(r[ci]))}</w:p></w:tc>`).join('')}</w:tr>`).join('')}</w:tbl><w:p/>`;
      }
      return P(b.text);
    })
    .join('');
  const hdr = meta.header
    ? `<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pStyle w:val="Header"/>${bidi}</w:pPr>${run(meta.header)}</w:p></w:hdr>`
    : null;
  const ftr = `<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr>${run((meta.footer || '') + '  ')}<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr>${hdr ? '<w:headerReference w:type="default" r:id="rIdH"/>' : ''}<w:footerReference w:type="default" r:id="rIdF"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/>${rtl ? '<w:bidi/>' : ''}</w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
 <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:jc w:val="both"/></w:pPr></w:style>
 <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:bCs/><w:sz w:val="34"/><w:szCs w:val="34"/><w:color w:val="0F3A68"/></w:rPr></w:style>
 ${[1, 2, 3].map(n => `<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="heading ${n}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="${360 - n * 60}" w:after="120"/><w:jc w:val="start"/><w:outlineLvl w:val="${n - 1}"/></w:pPr><w:rPr><w:b/><w:bCs/><w:sz w:val="${34 - n * 4}"/><w:szCs w:val="${34 - n * 4}"/><w:color w:val="0F3A68"/></w:rPr></w:style>`).join('')}
 <w:style w:type="paragraph" w:styleId="Header"><w:name w:val="header"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="16"/><w:color w:val="566378"/></w:rPr></w:style>
 <w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/></w:style></w:styles>`;
  const files = [
    {
      name: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>${hdr ? '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' : ''}<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
    },
    {
      name: '_rels/.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
    },
    {
      name: 'docProps/core.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEsc(meta.title || '')}</dc:title><dc:creator>${xmlEsc(meta.author || 'Audit-Plus')}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>`,
    },
    {
      name: 'word/_rels/document.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${hdr ? '<Relationship Id="rIdH" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>' : ''}<Relationship Id="rIdF" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>`,
    },
    { name: 'word/document.xml', data: doc },
    { name: 'word/styles.xml', data: styles },
    { name: 'word/footer1.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` + ftr },
  ];
  if (hdr)
    files.push({ name: 'word/header1.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` + hdr });
  return new Blob([zipStore(files)], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}
/* Convert rendered HTML (our limited markup) to docx blocks */
function htmlToBlocks(root) {
  const out = [];
  const txt = el =>
    el.innerText != null && el.isConnected ? el.innerText.trim() : el.textContent.replace(/\s+/g, ' ').trim();
  const walk = el => {
    for (const n of el.children) {
      if (n.classList.contains('noprint') || n.closest('.noprint')) continue;
      const tg = n.tagName;
      if (tg === 'H1' || tg === 'H2' || tg === 'H3' || tg === 'H4') {
        const t_ = txt(n);
        if (t_) out.push({ t: { H1: 'h1', H2: 'h2', H3: 'h2', H4: 'h3' }[tg], text: t_ });
      } else if (tg === 'P') {
        const t_ = txt(n);
        if (t_) out.push({ t: 'p', text: t_ });
      } else if (tg === 'UL' || tg === 'OL') {
        for (const li of n.children)
          if (li.tagName === 'LI') {
            const t_ = txt(li);
            if (t_) out.push({ t: 'li', text: t_ });
          }
      } else if (tg === 'TABLE') {
        const rows = [...n.querySelectorAll('tr')].map(tr =>
          [...tr.children]
            .filter(c => !c.classList.contains('noprint'))
            .map(c => {
              const s = c.querySelector('select');
              return s ? (s.selectedOptions[0] || {}).textContent || '' : txt(c);
            })
        );
        if (rows.length) out.push({ t: 'table', rows });
      } else walk(n);
    }
  };
  walk(root);
  return out;
}
async function docExport(id, fmt) {
  const tp = hub.TPLM[id];
  if (!tp) return;
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;inset-inline-start:-99999px;top:0;width:800px';
  host.innerHTML = docHTML(id, false);
  document.body.appendChild(host);
  try {
    const blocks = htmlToBlocks(host.querySelector('#docbody') || host);
    blocks.unshift({ t: 'title', text: tp.ar });
    const v = docVars(id);
    const blob = docxBlob(blocks, {
      title: tp.ar + ' — ' + v.company,
      author: hub.SESSION && hub.SESSION.display,
      header: `${SETTINGS.firmName || ''} · ${v.company} · ${v.year}`,
      footer: tp.en,
    });
    downloadBlob(blob, sanitizeName(tp.en + ' - ' + v.company + ' ' + v.year, 90) + '.docx');
    audit('document.export', { id, fmt: 'docx' });
    hub.toast('تم إنشاء ملف Word.', 's');
  } catch (e) {
    logErr('docExport ' + id, e);
    hub.toast('تعذر إنشاء الملف: ' + errMsg(e), 'e');
  } finally {
    host.remove();
  }
}

export { TE, crc32, docExport, docxBlob, htmlToBlocks, xlsxBlob };

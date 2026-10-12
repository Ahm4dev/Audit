/* Audit-Plus · v10 · Rich XLSX writer (styles, merges, widths, heights, RTL, print setup, validations, hyperlinks, deflate) */

import { TE, crc32 } from '../modules/18-file-writers.js';

/* =====================================================================================================
   XR.build(sheets, meta) → Promise<Blob>
   sheet = { name, rtl, grid:false, tab:'FF1F6F5C', landscape:true, header:'..', footer:'..',
             cols:[widthChars...], rows:[ {h:points, cells:[ {c, v, s:styleObj, span:[colSpan,rowSpan]} ]} ],
             merges:['A1:C1'], validations:[{sqref:'B2', list:['a','b']}], links:[{ref:'A1', loc:"'Sheet2'!A1"}] }
   styleObj = { b,i,u,sz,color,font, fill:'RRGGBB', bd:{l,r,t,b:{s:'thin',c:'RRGGBB'}}, h:'left|center|right', v:'top|center|bottom',
                wrap:true, ro:0|1|2, ind:n, nf:'#,##0.00' }
   ===================================================================================================== */
const XR = (() => {
  const X = s =>
    String(s == null ? '' : s)
      .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '');
  const cl = i => {
    let s = '';
    i++;
    while (i) {
      const m = (i - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      i = Math.floor((i - 1) / 26);
    }
    return s;
  };
  const argb = c => (c ? 'FF' + String(c).replace('#', '').toUpperCase().padStart(6, '0').slice(-6) : null);

  /* ---------- style registry ---------- */
  function StyleBook(font0) {
    const fonts = [],
      fills = [],
      borders = [],
      xfs = [],
      nfs = [];
    const fk = new Map(),
      flk = new Map(),
      bk = new Map(),
      xk = new Map(),
      nk = new Map();
    const mk = (arr, map, obj, xml) => {
      const k = JSON.stringify(obj);
      if (map.has(k)) return map.get(k);
      const i = arr.length;
      arr.push(xml(obj));
      map.set(k, i);
      return i;
    };
    const fontXml = f =>
      `<font>${f.b ? '<b/>' : ''}${f.i ? '<i/>' : ''}${f.u ? '<u/>' : ''}<sz val="${f.sz || 10}"/>${f.color ? `<color rgb="${f.color}"/>` : '<color theme="1"/>'}<name val="${X(f.name || font0)}"/><family val="2"/></font>`;
    const fillXml = c =>
      `<fill><patternFill patternType="solid"><fgColor rgb="${c}"/><bgColor indexed="64"/></patternFill></fill>`;
    const side = (n, b) =>
      b && b.s ? `<${n} style="${b.s}"><color rgb="${argb(b.c || '9AA7A3')}"/></${n}>` : `<${n}/>`;
    const bdXml = b =>
      `<border>${side('left', b.l)}${side('right', b.r)}${side('top', b.t)}${side('bottom', b.b)}<diagonal/></border>`;
    /* reserved: font 0, fills 0/1, border 0, xf 0 */
    fonts.push(fontXml({ sz: 10 }));
    fk.set(JSON.stringify({ sz: 10 }), 0);
    fills.push('<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>');
    borders.push('<border><left/><right/><top/><bottom/><diagonal/></border>');
    xfs.push('<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>');
    const nfId = code => {
      if (!code) return 0;
      if (code === '0') return 1;
      if (code === '0.00') return 2;
      if (code === '#,##0') return 3;
      if (code === '#,##0.00') return 4;
      if (code === '0%') return 9;
      if (code === '0.00%') return 10;
      if (nk.has(code)) return nk.get(code);
      const id = 164 + nfs.length;
      nfs.push(`<numFmt numFmtId="${id}" formatCode="${X(code)}"/>`);
      nk.set(code, id);
      return id;
    };
    function xf(st) {
      if (!st) return 0;
      const key = JSON.stringify(st);
      if (xk.has(key)) return xk.get(key);
      const f = {
        b: st.b ? 1 : 0,
        i: st.i ? 1 : 0,
        u: st.u ? 1 : 0,
        sz: st.sz || 10,
        color: argb(st.color),
        name: st.font,
      };
      const fid = mk(fonts, fk, f, fontXml);
      const flid = st.fill ? mk(fills, flk, argb(st.fill), fillXml) : 0;
      const bd = st.bd && (st.bd.l || st.bd.r || st.bd.t || st.bd.b) ? mk(borders, bk, st.bd, bdXml) : 0;
      const n = nfId(st.nf);
      const al =
        st.h || st.v || st.wrap || st.ro || st.ind
          ? `<alignment${st.h ? ` horizontal="${st.h}"` : ''}${st.v ? ` vertical="${st.v}"` : ''}${st.wrap ? ' wrapText="1"' : ''}${st.ro ? ` readingOrder="${st.ro}"` : ''}${st.ind ? ` indent="${st.ind}"` : ''}/>`
          : '';
      const x = `<xf numFmtId="${n}" fontId="${fid}" fillId="${flid}" borderId="${bd}" xfId="0"${n ? ' applyNumberFormat="1"' : ''} applyFont="1"${flid ? ' applyFill="1"' : ''}${bd ? ' applyBorder="1"' : ''}${al ? ' applyAlignment="1">' + al + '</xf>' : '/>'}`;
      const i = xfs.length;
      xfs.push(x);
      xk.set(key, i);
      return i;
    }
    const xml = () =>
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${nfs.length ? `<numFmts count="${nfs.length}">${nfs.join('')}</numFmts>` : ''}<fonts count="${fonts.length}">${fonts.join('')}</fonts><fills count="${fills.length}">${fills.join('')}</fills><borders count="${borders.length}">${borders.join('')}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
    return { xf, xml };
  }

  /* ---------- compression (CompressionStream deflate-raw; falls back to stored) ---------- */
  const CAN_DEFLATE = typeof CompressionStream === 'function';
  async function deflate(u8) {
    const cs = new CompressionStream('deflate-raw');
    const w = cs.writable.getWriter();
    w.write(u8);
    w.close();
    const buf = await new Response(cs.readable).arrayBuffer();
    return new Uint8Array(buf);
  }
  async function zip(files, compress) {
    const parts = [],
      central = [];
    let off = 0;
    const now = new Date();
    const dt = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff,
      dd = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;
    for (const f of files) {
      const name = TE.encode(f.name);
      const raw = typeof f.data === 'string' ? TE.encode(f.data) : f.data;
      const crc = crc32(raw);
      let data = raw,
        method = 0;
      if (compress && CAN_DEFLATE && raw.length > 200) {
        try {
          const d = await deflate(raw);
          if (d.length < raw.length) {
            data = d;
            method = 8;
          }
        } catch (e) {
          data = raw;
          method = 0;
        }
      }
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true);
      h.setUint16(4, 20, true);
      h.setUint16(6, 0x0800, true);
      h.setUint16(8, method, true);
      h.setUint16(10, dt, true);
      h.setUint16(12, dd, true);
      h.setUint32(14, crc, true);
      h.setUint32(18, data.length, true);
      h.setUint32(22, raw.length, true);
      h.setUint16(26, name.length, true);
      h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true);
      c.setUint16(4, 20, true);
      c.setUint16(6, 20, true);
      c.setUint16(8, 0x0800, true);
      c.setUint16(10, method, true);
      c.setUint16(12, dt, true);
      c.setUint16(14, dd, true);
      c.setUint32(16, crc, true);
      c.setUint32(20, data.length, true);
      c.setUint32(24, raw.length, true);
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
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  /* ---------- sheet names: ≤31 chars, no []:*?/\ , unique ---------- */
  function sheetNames(sheets) {
    const used = new Set();
    return sheets.map((s, i) => {
      let n =
        String(s.name || 'Sheet' + (i + 1))
          .replace(/[\[\]:*?\/\\]/g, '_')
          .replace(/^'+|'+$/g, '')
          .trim()
          .slice(0, 31) || 'Sheet' + (i + 1);
      let b = n,
        k = 2;
      while (used.has(n.toLowerCase())) {
        const sfx = '~' + k++;
        n = b.slice(0, 31 - sfx.length) + sfx;
      }
      used.add(n.toLowerCase());
      return n;
    });
  }

  /* ---------- build ---------- */
  async function build(sheets, meta) {
    meta = meta || {};
    const SB = StyleBook(meta.font || 'Arial');
    const SS = [],
      SI = new Map();
    const si = v => {
      v = String(v);
      let i = SI.get(v);
      if (i == null) {
        i = SS.length;
        SS.push(v);
        SI.set(v, i);
      }
      return i;
    };
    const names = sheetNames(sheets);
    const sx = sheets.map((sh, idx) => {
      const rows = sh.rows || [];
      const nCols = Math.max(sh.cols ? sh.cols.length : 0, 1);
      let maxCol = 0;
      const rx = rows
        .map((r, ri) => {
          if (!r) return '';
          const cells = (r.cells || []).slice().sort((a, b) => a.c - b.c);
          const cx = cells
            .map(c => {
              if (c.c + 1 > maxCol) maxCol = c.c + 1;
              const ref = cl(c.c) + (ri + 1);
              const s = SB.xf(c.s);
              const sa = s ? ` s="${s}"` : '';
              if (c.v == null || c.v === '') return `<c r="${ref}"${sa}/>`;
              if (typeof c.v === 'number' && isFinite(c.v)) return `<c r="${ref}"${sa}><v>${c.v}</v></c>`;
              if (c.f) return `<c r="${ref}"${sa} t="str"><f>${X(c.f)}</f><v>${X(c.v)}</v></c>`;
              return `<c r="${ref}"${sa} t="s"><v>${si(c.v)}</v></c>`;
            })
            .join('');
          const ht = r.h ? ` ht="${Math.min(409, Math.max(4, r.h)).toFixed(2)}" customHeight="1"` : '';
          return cx || ht ? `<row r="${ri + 1}"${ht}>${cx}</row>` : '';
        })
        .join('');
      const colsXml =
        sh.cols && sh.cols.length
          ? `<cols>${sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.min(120, Math.max(1.2, w)).toFixed(2)}" customWidth="1"/>`).join('')}</cols>`
          : '';
      const lastCol = cl(Math.max(maxCol, nCols) - 1);
      const dim = `A1:${lastCol}${Math.max(rows.length, 1)}`;
      const merges = (sh.merges || []).length
        ? `<mergeCells count="${sh.merges.length}">${sh.merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
        : '';
      const vals = (sh.validations || []).filter(v => v.list && v.list.length);
      const dvx = vals.length
        ? `<dataValidations count="${vals.length}">${vals.map(v => `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="0" sqref="${v.sqref}"><formula1>"${X(v.list.join(',').replace(/"/g, "''"))}"</formula1></dataValidation>`).join('')}</dataValidations>`
        : '';
      const lk = sh.links || [];
      const lkx = lk.length
        ? `<hyperlinks>${lk.map(l => `<hyperlink ref="${l.ref}" location="${X(l.loc)}"${l.tip ? ` tooltip="${X(l.tip)}"` : ''} display="${X(l.disp || '')}"/>`).join('')}</hyperlinks>`
        : '';
      const hf =
        sh.header || sh.footer
          ? `<headerFooter>${sh.header ? `<oddHeader>${X(sh.header)}</oddHeader>` : ''}${sh.footer ? `<oddFooter>${X(sh.footer)}</oddFooter>` : ''}</headerFooter>`
          : '';
      const pane = sh.freezeRows
        ? `<pane ySplit="${sh.freezeRows}" topLeftCell="A${sh.freezeRows + 1}" activePane="bottomLeft" state="frozen"/>`
        : '';
      const auto = sh.autoFilter ? `<autoFilter ref="${sh.autoFilter}"/>` : '';
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr>${sh.tab ? `<tabColor rgb="${argb(sh.tab)}"/>` : ''}<pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="${dim}"/><sheetViews><sheetView workbookViewId="0"${sh.rtl ? ' rightToLeft="1"' : ''}${sh.grid === false ? ' showGridLines="0"' : ''}${idx === 0 ? ' tabSelected="1"' : ''} zoomScale="${sh.zoom || 100}" zoomScaleNormal="${sh.zoom || 100}">${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15" customHeight="0"/>${colsXml}<sheetData>${rx}</sheetData>${auto}${merges}${dvx}${lkx}<printOptions horizontalCentered="1"/><pageMargins left="0.4" right="0.4" top="0.7" bottom="0.7" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="${sh.landscape === false ? 'portrait' : 'landscape'}" fitToWidth="1" fitToHeight="0"/>${hf}</worksheet>`;
    });
    const files = [];
    files.push({
      name: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
    });
    files.push({
      name: '_rels/.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
    });
    files.push({
      name: 'docProps/core.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${X(meta.title || 'Audit-Plus export')}</dc:title><dc:creator>${X(meta.author || 'Audit-Plus')}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>`,
    });
    files.push({
      name: 'docProps/app.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Audit-Plus</Application></Properties>`,
    });
    /* print titles/areas are not needed; keep workbook minimal but valid */
    files.push({
      name: 'xl/workbook.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><workbookPr/><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="28800" windowHeight="15000"/></bookViews><sheets>${names.map((n, i) => `<sheet name="${X(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`,
    });
    files.push({
      name: 'xl/_rels/workbook.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId${sheets.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
    });
    files.push({ name: 'xl/styles.xml', data: SB.xml() });
    sx.forEach((x, i) => files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: x }));
    files.push({
      name: 'xl/sharedStrings.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${SS.length}" uniqueCount="${SS.length}">${SS.map(v => `<si><t xml:space="preserve">${X(v)}</t></si>`).join('')}</sst>`,
    });
    return zip(files, true);
  }
  return { build, colLetter: cl, names: sheetNames, xml: X };
})();

export { XR };

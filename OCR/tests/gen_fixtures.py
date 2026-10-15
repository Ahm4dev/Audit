# -*- coding: utf-8 -*-
"""Generate test fixtures: DOCX (Arabic financial + English invoice), PDFs via LibreOffice,
simulated scans, mixed PDF, blank, corrupt and large files. Writes ground truth JSON."""
import os, json, random, subprocess, io, copy
from docx import Document
from docx.shared import Pt, RGBColor, Cm, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

OUT = os.path.join(os.path.dirname(__file__), 'fixtures')
os.makedirs(OUT, exist_ok=True)
random.seed(7); np.random.seed(7)
TRUTH = {}

def el(tag, **attrs):
    e = OxmlElement(tag)
    for k, v in attrs.items():
        e.set(qn(k), str(v))
    return e

def set_rtl(p):
    pPr = p._p.get_or_add_pPr()
    pPr.insert(0, el('w:bidi'))

def run_rtl(r):
    rPr = r._r.get_or_add_rPr()
    rPr.append(el('w:rtl'))

def add_par(doc, text, rtl=True, align=None, bold=False, size=None, color=None, style=None):
    p = doc.add_paragraph(style=style)
    if rtl: set_rtl(p)
    r = p.add_run(text)
    if rtl: run_rtl(r)
    r.bold = bold
    if size:
        r.font.size = Pt(size)
        r._r.get_or_add_rPr().append(el('w:szCs', **{'w:val': int(size * 2)}))
    if bold: r._r.get_or_add_rPr().append(el('w:bCs'))
    if color: r.font.color.rgb = RGBColor.from_string(color)
    if align is not None: p.alignment = align
    return p

def cell_text(cell, text, rtl=True, bold=False, align=None, shade=None):
    p = cell.paragraphs[0]
    if rtl: set_rtl(p)
    r = p.add_run(text)
    if rtl: run_rtl(r)
    if bold:
        r.bold = True
        r._r.get_or_add_rPr().append(el('w:bCs'))
    if align is not None: p.alignment = align
    if shade:
        tcPr = cell._tc.get_or_add_tcPr()
        tcPr.append(el('w:shd', **{'w:val': 'clear', 'w:color': 'auto', 'w:fill': shade}))

def table_rtl(t):
    tblPr = t._tbl.tblPr
    tblPr.append(el('w:bidiVisual'))

def add_hyperlink(p, url, text):
    part = p.part
    r_id = part.relate_to(url, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', is_external=True)
    h = el('w:hyperlink', **{'r:id': r_id})
    r = OxmlElement('w:r'); rPr = OxmlElement('w:rPr')
    rPr.append(el('w:color', **{'w:val': '0563C1'})); rPr.append(el('w:u', **{'w:val': 'single'}))
    r.append(rPr); t = OxmlElement('w:t'); t.text = text; r.append(t); h.append(r); p._p.append(h)

def page_field(p):
    r = p.add_run()
    r._r.append(el('w:fldChar', **{'w:fldCharType': 'begin'}))
    r2 = p.add_run(); it = OxmlElement('w:instrText'); it.set(qn('xml:space'), 'preserve'); it.text = ' PAGE '; r2._r.append(it)
    r3 = p.add_run(); r3._r.append(el('w:fldChar', **{'w:fldCharType': 'separate'}))
    r4 = p.add_run('1')
    r5 = p.add_run(); r5._r.append(el('w:fldChar', **{'w:fldCharType': 'end'}))

def logo_png():
    im = Image.new('RGB', (360, 120), (15, 107, 92))
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 44)
    d.text((24, 32), 'NILE CO.', font=f, fill=(255, 255, 255))
    b = io.BytesIO(); im.save(b, 'PNG'); b.seek(0); return b

def fmt(v):
    s = f'{abs(v):,}'
    return f'({s})' if v < 0 else s

# ------------------------------------------------------------------ DOCX 1: Arabic financial statements
def make_fin_ar():
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    sec.left_margin = sec.right_margin = Cm(2); sec.top_margin = sec.bottom_margin = Cm(2)
    sec.header.is_linked_to_previous = False
    hp = sec.header.paragraphs[0]; set_rtl(hp); r = hp.add_run('شركة النيل للتجارة والتوزيع (ش.م.م) — القوائم المالية'); run_rtl(r)
    hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fp = sec.footer.paragraphs[0]; fp.alignment = WD_ALIGN_PARAGRAPH.CENTER; page_field(fp)
    for s in ('Normal',):
        st = doc.styles[s]; st.font.name = 'DejaVu Sans'; st.font.size = Pt(11)
        st.element.rPr.rFonts.set(qn('w:cs'), 'DejaVu Sans')
    h = doc.add_heading(level=1); set_rtl(h); r = h.add_run('قائمة المركز المالي في 31 ديسمبر 2025'); run_rtl(r)
    h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    intro = ('تم إعداد هذه القوائم المالية وفقًا لمعايير المحاسبة المصرية (EAS) الصادرة بقرار وزير الاستثمار رقم 110 لسنة 2015، '
             'وتُعرض جميع المبالغ بالجنيه المصري (EGP) ما لم يُذكر خلاف ذلك. وقد بلغ صافي الربح 1,245,300 جنيه مقابل 987,650 جنيه في العام السابق، '
             'بنسبة نمو 26.09% تقريبًا، وفقًا لتقرير مراقب الحسابات المؤرخ 15/03/2026.')
    p = add_par(doc, intro, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_par(doc, 'أهم السياسات المحاسبية:', bold=True, size=13, color='0F6B5C')
    for t in ['الأصول الثابتة تُقاس بالتكلفة مطروحًا منها مجمع الإهلاك.', 'المخزون يُقاس بالتكلفة أو صافي القيمة البيعية أيهما أقل.', 'الإيراد يُعترف به وفق معيار رقم 48.']:
        add_par(doc, t, style='List Bullet')
    for t in ['مراجعة أرصدة العملاء', 'مطابقة البنوك', 'جرد المخزون']:
        add_par(doc, t, style='List Number')
    # main table
    rows = [('البيان', 'إيضاح', '2025', '2024')]
    data = [
        ('الأصول غير المتداولة', None, None, None),
        ('أصول ثابتة', '5', 4250000, 3980500),
        ('مشروعات تحت التنفيذ', '6', 615200, 0),
        ('إجمالي الأصول غير المتداولة', '', 4865200, 3980500),
        ('الأصول المتداولة', None, None, None),
        ('مخزون', '7', 1320450, 1105300),
        ('عملاء وأوراق قبض', '8', 2210875, 1987600),
        ('نقدية بالبنوك', '9', 845000, 612340),
        ('إجمالي الأصول المتداولة', '', 4376325, 3705240),
        ('مخصص خسائر ائتمانية', '10', -125000, -98000),
        ('إجمالي الأصول', '', 9116525, 7587740),
    ]
    t = doc.add_table(rows=2 + len(data), cols=4)
    t.style = 'Table Grid'; table_rtl(t)
    # header: two rows, merged "الأرصدة بالجنيه" across 2025/2024; البيان and إيضاح merged vertically
    a = t.cell(0, 0).merge(t.cell(1, 0)); cell_text(a, 'البيان', bold=True, shade='D9E8E4')
    b = t.cell(0, 1).merge(t.cell(1, 1)); cell_text(b, 'إيضاح', bold=True, shade='D9E8E4', align=WD_ALIGN_PARAGRAPH.CENTER)
    c = t.cell(0, 2).merge(t.cell(0, 3)); cell_text(c, 'الأرصدة بالجنيه المصري', bold=True, shade='D9E8E4', align=WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.cell(1, 2), '2025', bold=True, shade='D9E8E4', align=WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.cell(1, 3), '2024', bold=True, shade='D9E8E4', align=WD_ALIGN_PARAGRAPH.CENTER)
    for i, (lab, note, v1, v2) in enumerate(data):
        rr = 2 + i
        tot = lab.startswith('إجمالي')
        if note is None:
            m = t.cell(rr, 0).merge(t.cell(rr, 3)); cell_text(m, lab, bold=True, shade='F2F2F2')
            continue
        cell_text(t.cell(rr, 0), lab, bold=tot)
        cell_text(t.cell(rr, 1), note, align=WD_ALIGN_PARAGRAPH.CENTER)
        cell_text(t.cell(rr, 2), fmt(v1), bold=tot, align=WD_ALIGN_PARAGRAPH.LEFT)
        cell_text(t.cell(rr, 3), fmt(v2), bold=tot, align=WD_ALIGN_PARAGRAPH.LEFT)
    widths = [Cm(7.5), Cm(1.8), Cm(3.6), Cm(3.6)]
    for row in t.rows:
        for i, w in enumerate(widths): row.cells[i].width = w
    p = add_par(doc, '')
    p = doc.add_paragraph(); set_rtl(p)
    r = p.add_run('للاطلاع على المعايير راجع موقع الهيئة العامة للرقابة المالية: '); run_rtl(r)
    add_hyperlink(p, 'https://fra.gov.eg', 'fra.gov.eg')
    p = doc.add_paragraph(); set_rtl(p)
    r = p.add_run('ملاحظة مهمة: '); run_rtl(r); r.bold = True; r.font.color.rgb = RGBColor(0xB4, 0x23, 0x18)
    r = p.add_run('الأرقام بين قوسين تمثل قيمًا سالبة.'); run_rtl(r); r.underline = True
    doc.add_picture(logo_png(), width=Cm(6))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    # page 2: two columns
    new = doc.add_section(WD_SECTION.NEW_PAGE)
    sectPr = new._sectPr
    for c in sectPr.findall(qn('w:cols')): sectPr.remove(c)
    pgMar = sectPr.find(qn('w:pgMar')); pgMar.addnext(el('w:cols', **{'w:num': 2, 'w:space': 720}))
    h = doc.add_heading(level=2); set_rtl(h); r = h.add_run('الإيضاحات المتممة للقوائم المالية'); run_rtl(r)
    col_txt = ('تأسست الشركة في جمهورية مصر العربية طبقًا لأحكام القانون رقم 159 لسنة 1981 ولائحته التنفيذية، '
               'ويتمثل نشاطها الرئيسي في التجارة العامة والتوزيع والاستيراد والتصدير. ويقع المركز الرئيسي للشركة في مدينة القاهرة. ')
    for i in range(5):
        add_par(doc, f'{i+1}- ' + col_txt, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    new2 = doc.add_section(WD_SECTION.CONTINUOUS)
    sp2 = new2._sectPr
    for c in sp2.findall(qn('w:cols')): sp2.remove(c)
    sp2.find(qn('w:pgMar')).addnext(el('w:cols', **{'w:num': 1}))
    add_par(doc, 'قائمة الدخل المختصرة', bold=True, size=13, align=WD_ALIGN_PARAGRAPH.CENTER)
    inc = [('المبيعات', 15430000, 12875000), ('تكلفة المبيعات', -10215000, -8640000), ('مجمل الربح', 5215000, 4235000),
           ('مصروفات إدارية وعمومية', -2310700, -1987350), ('صافي الربح قبل الضرائب', 2904300, 2247650), ('ضريبة الدخل', -653468, -505721)]
    t2 = doc.add_table(rows=len(inc) + 1, cols=3); table_rtl(t2)
    cell_text(t2.cell(0, 0), 'البند', bold=True); cell_text(t2.cell(0, 1), '2025', bold=True); cell_text(t2.cell(0, 2), '2024', bold=True)
    for i, (l, a1, a2) in enumerate(inc):
        cell_text(t2.cell(i + 1, 0), l); cell_text(t2.cell(i + 1, 1), fmt(a1), align=WD_ALIGN_PARAGRAPH.LEFT); cell_text(t2.cell(i + 1, 2), fmt(a2), align=WD_ALIGN_PARAGRAPH.LEFT)
    for row in t2.rows:
        for i, w in enumerate([Cm(8), Cm(4), Cm(4)]): row.cells[i].width = w
    p = add_par(doc, '')
    p = doc.add_paragraph('This English paragraph is left-to-right and contains the amount EGP 2,250,832 and the date 31/12/2025. '
                          'It verifies mixed-direction documents keep their word order intact.')
    doc.save(os.path.join(OUT, 'fin_ar.docx'))
    TRUTH['fin_ar'] = {'numbers': ['1,245,300', '987,650', '26.09%', '4,250,000', '3,980,500', '615,200', '4,865,200', '1,320,450', '1,105,300',
                                   '2,210,875', '1,987,600', '845,000', '612,340', '4,376,325', '3,705,240', '(125,000)', '(98,000)', '9,116,525',
                                   '7,587,740', '15,430,000', '12,875,000', '(10,215,000)', '(8,640,000)', '2,250,832'],
                       'tables': 2}

# ------------------------------------------------------------------ DOCX 2: English invoice with multi-page table
def make_invoice():
    doc = Document()
    sec = doc.sections[0]; sec.page_width, sec.page_height = Inches(8.5), Inches(11)
    st = doc.styles['Normal']; st.font.name = 'Liberation Sans'; st.font.size = Pt(10)
    t = doc.add_paragraph(); r = t.add_run('TAX INVOICE'); r.bold = True; r.font.size = Pt(20); r.font.color.rgb = RGBColor(0x1F, 0x3A, 0x5F)
    kv = doc.add_table(rows=4, cols=4)
    vals = [('Invoice No:', 'INV-2026-0418', 'Date:', '14/10/2026'), ('Customer:', 'شركة الدلتا للمقاولات', 'Tax ID:', '312-456-789'),
            ('Currency:', 'EGP', 'Due date:', '13/11/2026'), ('Payment terms:', 'Net 30', 'PO ref:', 'PO-77812')]
    for i, row in enumerate(vals):
        for j, v in enumerate(row):
            p = kv.cell(i, j).paragraphs[0]; r = p.add_run(v)
            if j % 2 == 0: r.bold = True
            if any('؀' <= ch <= 'ۿ' for ch in v): set_rtl(p); run_rtl(r)
    doc.add_paragraph()
    items = []
    tb = doc.add_table(rows=1, cols=6); tb.style = 'Table Grid'
    hdr = ['#', 'Description', 'Qty', 'Unit price', 'Discount', 'Amount']
    for j, h in enumerate(hdr):
        cell_text(tb.cell(0, j), h, rtl=False, bold=True, shade='1F3A5F')
        tb.cell(0, j).paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    trPr = tb.rows[0]._tr.get_or_add_trPr(); trPr.append(el('w:tblHeader'))
    total = 0
    names = ['Steel rebar 12mm', 'Cement bags 50kg', 'Ceramic tiles 60x60', 'PVC pipes 4in', 'Electrical cable 2.5mm', 'Paint (white) 20L',
             'Wooden doors', 'Aluminium windows', 'Sand (m3)', 'Gravel (m3)']
    for i in range(55):
        q = random.randint(1, 400); up = round(random.uniform(5, 2500), 2); disc = round(q * up * random.choice([0, 0, 0.05, 0.1]), 2)
        amt = round(q * up - disc, 2); total += amt
        row = tb.add_row().cells
        vals = [str(i + 1), names[i % len(names)], str(q), f'{up:,.2f}', f'({disc:,.2f})' if disc else '-', f'{amt:,.2f}']
        for j, v in enumerate(vals):
            cell_text(row[j], v, rtl=False, align=WD_ALIGN_PARAGRAPH.RIGHT if j >= 2 else None)
        items.append(vals)
    row = tb.add_row().cells
    m = row[0].merge(row[4]); cell_text(m, 'Total', rtl=False, bold=True, align=WD_ALIGN_PARAGRAPH.RIGHT)
    cell_text(row[5], f'{total:,.2f}', rtl=False, bold=True, align=WD_ALIGN_PARAGRAPH.RIGHT)
    doc.add_paragraph()
    doc.add_paragraph('Notes: Goods remain the property of the seller until full payment. Bank: National Bank of Egypt, IBAN EG38 0019 0005 0000 0000 2631 8000 2.')
    doc.save(os.path.join(OUT, 'invoice_en.docx'))
    TRUTH['invoice_en'] = {'items': items, 'total': f'{total:,.2f}'}

def to_pdf(name):
    subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', OUT, os.path.join(OUT, name)],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def degrade(img, angle, dpi_scale=1.0, tint=(238, 232, 214), noise=12, shadow=True, jpeg=55):
    img = img.convert('L')
    if dpi_scale != 1.0:
        img = img.resize((int(img.width * dpi_scale), int(img.height * dpi_scale)), Image.BILINEAR)
    a = np.asarray(img).astype(np.float32) / 255.0
    h, w = a.shape
    rgb = np.stack([a * t + (1 - a) * 30 for t in tint], -1)
    if shadow:
        g = np.linspace(0.62, 1.0, w)[None, :, None]
        rgb = rgb * g
    rgb = rgb + np.random.normal(0, noise, rgb.shape)
    # speckle
    sp = np.random.rand(h, w) < 0.0015
    rgb[sp] = 40
    im = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
    im = im.rotate(angle, resample=Image.BICUBIC, expand=False, fillcolor=tint)
    im = im.filter(ImageFilter.GaussianBlur(0.6))
    b = io.BytesIO(); im.save(b, 'JPEG', quality=jpeg); b.seek(0)
    return Image.open(b).convert('RGB')

def make_scans():
    from pdf2image import convert_from_path
    import img2pdf
    pages = convert_from_path(os.path.join(OUT, 'fin_ar.pdf'), dpi=200)
    inv = convert_from_path(os.path.join(OUT, 'invoice_en.pdf'), dpi=200)
    imgs = [degrade(pages[0], 1.6), degrade(inv[0], -1.2), degrade(pages[1], 0.0, dpi_scale=0.55),
            degrade(inv[0], 0.4).rotate(180, expand=True)]
    dpis = [200, 200, 110, 200]
    paths = []
    for i, (im, d) in enumerate(zip(imgs, dpis)):
        p = os.path.join(OUT, f'_scan{i}.jpg'); im.save(p, 'JPEG', quality=70, dpi=(d, d)); paths.append(p)
    lay = [img2pdf.get_layout_fun((img2pdf.in_to_pt(im.width / d), img2pdf.in_to_pt(im.height / d))) for im, d in zip(imgs, dpis)]
    with open(os.path.join(OUT, 'scanned_mixed_quality.pdf'), 'wb') as f:
        f.write(img2pdf.convert(paths, layout_fun=lambda *a: lay[0](*a)))
    # each page has own size: use per-image dpi metadata (img2pdf respects jpeg dpi)
    with open(os.path.join(OUT, 'scanned_mixed_quality.pdf'), 'wb') as f:
        f.write(img2pdf.convert(paths))
    for p in paths: os.remove(p)

def make_mixed_and_misc():
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from pdf2image import convert_from_path
    inv = convert_from_path(os.path.join(OUT, 'invoice_en.pdf'), dpi=200)[0]
    crop = degrade(inv.crop((80, 380, 1620, 1250)), 0.8, shadow=False)
    cp = os.path.join(OUT, '_crop.jpg'); crop.save(cp, quality=75)
    c = canvas.Canvas(os.path.join(OUT, 'mixed_text_and_scan.pdf'), pagesize=A4)
    W, H = A4
    c.setFont('Helvetica-Bold', 18); c.drawString(50, H - 60, 'Audit working paper WP-12: Purchases testing')
    c.setFont('Helvetica', 10)
    y = H - 90
    for line in ['The table below is a scanned extract of supplier invoice INV-2026-0418 attached as evidence.',
                 'Tested by: M. Moussa   Reviewed by: A. Hassan   Date: 14/10/2026']:
        c.drawString(50, y, line); y -= 14
    iw = W - 100; ih = iw * crop.height / crop.width
    c.drawImage(cp, 50, y - ih - 10, width=iw, height=ih)
    y = y - ih - 40
    c.setFont('Helvetica', 10)
    c.drawString(50, y, 'Conclusion: no exceptions noted. Sample size 25 items, total tested EGP 1,284,330.50.')
    c.showPage()
    c.showPage()  # blank page
    c.setFont('Helvetica', 11); c.drawString(50, H - 60, 'Page 3 after a blank page.'); c.showPage()
    c.save(); os.remove(cp)
    # large text pdf (80 pages) with a table on each page
    c = canvas.Canvas(os.path.join(OUT, 'large_80pages.pdf'), pagesize=A4)
    for pg in range(80):
        c.setFont('Helvetica-Bold', 14); c.drawString(50, H - 50, f'General ledger extract - page {pg+1}')
        c.setFont('Helvetica', 9)
        y = H - 80
        c.line(50, y + 10, W - 50, y + 10)
        for r in range(40):
            vals = [f'{pg*40+r+1:05d}', f'2026-0{1+r%9}-{10+r%18}', f'Journal entry {r}', f'{random.randint(100,99999):,}.00']
            xs = [55, 120, 210, 470]
            for x, v in zip(xs, vals):
                if x == 470: c.drawRightString(W - 60, y, v)
                else: c.drawString(x, y, v)
            y -= 16
        c.drawCentredString(W / 2, 30, f'Page {pg+1} of 80')
        c.showPage()
    c.save()
    # corrupt files
    raw = open(os.path.join(OUT, 'fin_ar.pdf'), 'rb').read()
    open(os.path.join(OUT, 'corrupt_truncated.pdf'), 'wb').write(raw[:len(raw) // 3])
    open(os.path.join(OUT, 'corrupt.docx'), 'wb').write(b'PK\x03\x04' + os.urandom(3000))
    open(os.path.join(OUT, 'old_format.docx'), 'wb').write(b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1' + os.urandom(4000))

if __name__ == '__main__':
    make_fin_ar(); make_invoice()
    to_pdf('fin_ar.docx'); to_pdf('invoice_en.docx')
    make_scans(); make_mixed_and_misc()
    json.dump(TRUTH, open(os.path.join(OUT, 'truth.json'), 'w'), ensure_ascii=False, indent=1)
    print(sorted(os.listdir(OUT)))

from pathlib import Path
from datetime import datetime
from collections import defaultdict
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, HRFlowable
)
from reportlab.graphics.shapes import Drawing, Rect, String


BASE = Path(r"C:\Users\win\.codex\visualizations\2026\11\02\01a19ba7-f613-7d72-a163-e931b0401430")
SOURCE = Path(r"C:\Users\win\Desktop\ögretmen evi")
OUTPUT = BASE / "output" / "pdf" / "ogretmen_evi_giris_cikis_degerlendirme_raporu.pdf"

NAMES = {
    1: "Hasan ÇELİKAL", 2: "Eyüp AKBAŞ", 3: "Fahrettin DURSUN",
    4: "Metin ERTUĞRUL", 5: "Şehmus TURGUT", 6: "Halit TİKEN",
    7: "Halise YILDIZ", 8: "Yıldız TAYMUR", 9: "Muhlise ÖZDENİZ",
    10: "Ercan IŞIK", 11: "Çetin GARCAN", 12: "Felek BARABAY",
    13: "Remziye KAPUCU", 14: "Kadriye DEMİR", 15: "Betül KAYA",
    16: "Muhlise ÖZDENİZ (yeni kart)",
}

LINE_RE = re.compile(
    r"^\d+,(?P<card>\d+),\d+ (?P<date>\d{4}/\d{2}/\d{2}) "
    r"(?P<time>\d{2}:\d{2}:\d{2}) \d+$"
)


def register_fonts():
    candidates = [
        ("DejaVu", r"C:\Windows\Fonts\DejaVuSans.ttf", r"C:\Windows\Fonts\DejaVuSans-Bold.ttf"),
        ("Arial", r"C:\Windows\Fonts\arial.ttf", r"C:\Windows\Fonts\arialbd.ttf"),
    ]
    for family, regular, bold in candidates:
        if Path(regular).exists() and Path(bold).exists():
            pdfmetrics.registerFont(TTFont(family, regular))
            pdfmetrics.registerFont(TTFont(f"{family}-Bold", bold))
            return family, f"{family}-Bold"
    return "Helvetica", "Helvetica-Bold"


FONT, FONT_BOLD = register_fonts()
NAVY = colors.HexColor("#17324D")
BLUE = colors.HexColor("#246B9B")
TEAL = colors.HexColor("#2A8C82")
LIGHT = colors.HexColor("#EAF1F6")
PALE = colors.HexColor("#F6F8FA")
AMBER = colors.HexColor("#E3A72F")
RED = colors.HexColor("#B84A4A")
GRAY = colors.HexColor("#5C6873")


def parse_data():
    records = []
    file_stats = []
    for path in sorted(SOURCE.glob("*.txt")):
        current = []
        with path.open("r", encoding="utf-8-sig", errors="replace") as stream:
            for line_no, line in enumerate(stream, 1):
                raw = line.strip()
                if not raw:
                    continue
                match = LINE_RE.match(raw)
                if not match:
                    raise ValueError(f"Çözümlenemeyen satır: {path.name}:{line_no}")
                dt = datetime.strptime(
                    f"{match.group('date')} {match.group('time')}",
                    "%Y/%m/%d %H:%M:%S",
                )
                row = {
                    "file": path.name, "line": line_no,
                    "card": int(match.group("card")), "dt": dt,
                }
                records.append(row)
                current.append(row)
        dates = {r["dt"].date() for r in current}
        file_stats.append({
            "file": path.name,
            "count": len(current),
            "days": len(dates),
            "first": min(r["dt"] for r in current),
            "last": max(r["dt"] for r in current),
        })
    return records, file_stats


def analyze(records):
    by_card = defaultdict(list)
    for row in records:
        by_card[row["card"]].append(row)
    stats = []
    for card in sorted(by_card):
        rows = sorted(by_card[card], key=lambda r: (r["dt"], r["file"], r["line"]))
        durations = []
        for idx in range(0, len(rows) - 1, 2):
            durations.append((rows[idx + 1]["dt"] - rows[idx]["dt"]).total_seconds() / 3600)
        valid = [h for h in durations if 0 <= h <= 24]
        long = [h for h in durations if h > 24]
        stats.append({
            "card": card,
            "name": NAMES[card],
            "readings": len(rows),
            "pairs": len(durations),
            "valid_pairs": len(valid),
            "long_pairs": len(long),
            "open": len(rows) % 2,
            "hours": sum(valid),
            "avg": sum(valid) / len(valid) if valid else 0,
            "first": rows[0]["dt"],
            "last": rows[-1]["dt"],
        })
    return stats


def p(text, style):
    return Paragraph(text, style)


def fmt_dt(value):
    return value.strftime("%d.%m.%Y %H:%M")


def fmt_num(value, decimals=0):
    if decimals:
        return f"{value:,.{decimals}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{int(value):,}".replace(",", ".")


def table(data, widths, header=True, font_size=7.2, aligns=None):
    t = Table(data, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    rules = [
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
        ("TEXTCOLOR", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CCD6DE")),
    ]
    if header:
        rules += [
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), FONT_BOLD),
        ]
        for row in range(1, len(data)):
            if row % 2 == 0:
                rules.append(("BACKGROUND", (0, row), (-1, row), PALE))
    if aligns:
        for col, align in enumerate(aligns):
            rules.append(("ALIGN", (col, 1 if header else 0), (col, -1), align))
    t.setStyle(TableStyle(rules))
    return t


def summary_cards(items, styles):
    cells = []
    for value, label, color in items:
        cells.append(Table([
            [p(value, styles["metric"])],
            [p(label, styles["metric_label"])],
        ], colWidths=[42 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), color),
            ("BOX", (0, 0), (-1, -1), 0, color),
            ("TOPPADDING", (0, 0), (-1, 0), 7),
            ("BOTTOMPADDING", (0, 1), (-1, 1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ])))
    outer = Table([cells], colWidths=[45 * mm] * len(cells), hAlign="LEFT")
    outer.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    return outer


def bar_chart(stats):
    top = sorted(stats, key=lambda s: s["readings"], reverse=True)[:10]
    width, height = 510, 190
    d = Drawing(width, height)
    d.add(Rect(0, 0, width, height, fillColor=colors.white, strokeColor=colors.HexColor("#D7E0E7")))
    max_value = max(s["readings"] for s in top)
    left, right, top_y = 112, 35, height - 22
    usable = width - left - right
    for idx, item in enumerate(top):
        y = top_y - idx * 16
        bar_w = usable * item["readings"] / max_value
        d.add(String(8, y + 2, item["name"].split(" (")[0][:20], fontName=FONT, fontSize=7, fillColor=NAVY))
        d.add(Rect(left, y, bar_w, 9, fillColor=TEAL if item["card"] != 9 else BLUE, strokeColor=None))
        d.add(String(left + bar_w + 4, y + 1, str(item["readings"]), fontName=FONT_BOLD, fontSize=7, fillColor=NAVY))
    return d


def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 13 * mm, w, 13 * mm, fill=1, stroke=0)
    canvas.setFont(FONT_BOLD, 8.5)
    canvas.setFillColor(colors.white)
    canvas.drawString(17 * mm, h - 8.5 * mm, "ÖĞRETMEN EVİ - GİRİŞ ÇIKIŞ DEVAM RAPORU")
    canvas.setStrokeColor(colors.HexColor("#CBD5DD"))
    canvas.line(17 * mm, 13 * mm, w - 17 * mm, 13 * mm)
    canvas.setFont(FONT, 7.5)
    canvas.setFillColor(GRAY)
    canvas.drawString(17 * mm, 8.5 * mm, "Rapor tarihi: 02.11.2026 | Kayıt temelli değerlendirme")
    canvas.drawRightString(w - 17 * mm, 8.5 * mm, f"Sayfa {doc.page}")
    canvas.restoreState()


def build():
    records, file_stats = parse_data()
    stats = analyze(records)
    first = min(r["dt"] for r in records)
    last = max(r["dt"] for r in records)
    all_dates = sorted({r["dt"].date() for r in records})
    total_pairs = sum(s["pairs"] for s in stats)
    valid_pairs = sum(s["valid_pairs"] for s in stats)
    long_pairs = sum(s["long_pairs"] for s in stats)
    open_count = sum(s["open"] for s in stats)
    valid_hours = sum(s["hours"] for s in stats)

    doc = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4,
        leftMargin=17 * mm, rightMargin=17 * mm,
        topMargin=20 * mm, bottomMargin=18 * mm,
        title="Öğretmen Evi Giriş Çıkış Devam Sistemi Değerlendirme Raporu",
        author="Kayıt temelli değerlendirme",
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="TitleTR", fontName=FONT_BOLD, fontSize=22, leading=27, textColor=NAVY, spaceAfter=7))
    styles.add(ParagraphStyle(name="SubtitleTR", fontName=FONT, fontSize=10, leading=15, textColor=GRAY, spaceAfter=12))
    styles.add(ParagraphStyle(name="H1TR", fontName=FONT_BOLD, fontSize=14, leading=18, textColor=NAVY, spaceBefore=7, spaceAfter=7))
    styles.add(ParagraphStyle(name="H2TR", fontName=FONT_BOLD, fontSize=10.5, leading=14, textColor=BLUE, spaceBefore=5, spaceAfter=4))
    styles.add(ParagraphStyle(name="BodyTR", fontName=FONT, fontSize=8.8, leading=13, textColor=NAVY, spaceAfter=6))
    styles.add(ParagraphStyle(name="SmallTR", fontName=FONT, fontSize=7.5, leading=10.5, textColor=GRAY, spaceAfter=4))
    styles.add(ParagraphStyle(name="Callout", fontName=FONT, fontSize=8.5, leading=12.5, textColor=NAVY, backColor=LIGHT, borderColor=BLUE, borderWidth=0.8, borderPadding=8, spaceAfter=8))
    styles.add(ParagraphStyle(name="Warn", fontName=FONT, fontSize=8.5, leading=12.5, textColor=NAVY, backColor=colors.HexColor("#FFF7E4"), borderColor=AMBER, borderWidth=0.8, borderPadding=8, spaceAfter=8))
    styles.add(ParagraphStyle(name="metric", fontName=FONT_BOLD, fontSize=17, leading=20, textColor=colors.white, alignment=TA_LEFT))
    styles.add(ParagraphStyle(name="metric_label", fontName=FONT, fontSize=7.5, leading=10, textColor=colors.white))

    story = []
    story += [Spacer(1, 9 * mm), p("Giriş Çıkış Devam Sistemi<br/>Değerlendirme Raporu", styles["TitleTR"])]
    story += [p(f"İncelenen dönem: {fmt_dt(first)} - {fmt_dt(last)}", styles["SubtitleTR"])]
    story += [HRFlowable(width="100%", thickness=2, color=TEAL, spaceBefore=2, spaceAfter=12)]
    story += [summary_cards([
        (fmt_num(len(records)), "Toplam ham okuma", NAVY),
        (fmt_num(total_pairs), "Giriş-çıkış çifti", BLUE),
        (fmt_num(len(all_dates)), "Kayıt bulunan gün", TEAL),
        (fmt_num(len(stats)), "Tanımlı kart", colors.HexColor("#6A5B8C")),
    ], styles), Spacer(1, 8 * mm)]
    story += [p("Yönetici özeti", styles["H1TR"])]
    story += [p(
        "Dört metin dosyasındaki tüm satırlar tarih-saat alanlarına göre incelenmiştir. Dosya adları dönem kabul edilmemiş; her hareketin kendi tarihi kullanılmıştır. Toplam 5.671 ham okumanın tamamı korunmuş, hiçbir kayıt mükerrer kabul edilerek silinmemiştir.",
        styles["BodyTR"])]
    story += [p(
        "Kullanıcı tarafından belirlenen kurala göre her kartta kronolojik 1. okuma giriş, 2. okuma çıkış olarak eşleştirilmiştir. Bu yöntem 2.832 tamamlanmış çift üretmiştir. Bunların 381'i 24 saati aşmaktadır ve veri kesintisi veya eksik okuma ihtimali nedeniyle çalışma süresi toplamına katılmamıştır.",
        styles["Callout"])]
    story += [p("Temel sonuçlar", styles["H2TR"])]
    bullets = [
        "Kayıt kapsamı 24.09.2024 21:17 ile 10.09.2026 09:36 arasındadır.",
        "20.05.2026 - 30.06.2026 arasında 42 tam gün; 29.04.2026 - 10.05.2026 arasında 12 tam gün sistem genelinde kayıt yoktur.",
        "00007 Halise YILDIZ kartı, 00016 ile aynı dönemde çalışmaya devam ettiği için 00016 Halise'nin devam kartı değildir.",
        "00009 Muhlise ÖZDENİZ kartı 18.01.2026'da kesilmiş, 00016 kartı 02.07.2026'da başlamıştır. Çakışma olmadığından 00016 bu raporda Muhlise'nin yeni kartı kabul edilmiştir.",
        f"24 saat ve altındaki {fmt_num(valid_pairs)} çiftin hesaplanabilir toplam süresi {fmt_num(valid_hours, 1)} saattir. Bu değer bordro veya yasal mesai hesabı değil, ham kayıt göstergesidir.",
    ]
    for item in bullets:
        story.append(p(f"• {item}", styles["BodyTR"]))

    story += [PageBreak(), p("1. Kapsam ve yöntem", styles["H1TR"])]
    story += [p(
        "Kaynak klasördeki tüm TXT kayıtları ve personel kart ekran görüntüsü birlikte değerlendirilmiştir. Metin satırı yapısı cihaz, kart, hareket alanı, tarih, saat ve son alandan oluşmaktadır. Tüm satırlar çözümlenmiş; bozuk formatlı satır saptanmamıştır.", styles["BodyTR"])]
    story += [p("Eşleştirme kuralı", styles["H2TR"])]
    method_data = [
        ["Adım", "Uygulanan kural"],
        ["1", "Her kartın tüm okumaları gerçek tarih-saat sırasına dizildi."],
        ["2", "1., 3., 5. ve devam eden tek sıralı okumalar giriş kabul edildi."],
        ["3", "2., 4., 6. ve devam eden çift sıralı okumalar çıkış kabul edildi."],
        ["4", "Son okumada eşleşmeyen tek kayıt açık giriş olarak işaretlendi."],
        ["5", "24 saati aşan çiftler süre toplamından çıkarılıp inceleme kaydı yapıldı."],
    ]
    story += [table(method_data, [18 * mm, 158 * mm], font_size=8.3, aligns=["CENTER", "LEFT"]), Spacer(1, 6 * mm)]
    story += [p(
        "Önemli sınırlama: Çalışma takvimi, vardiya planı, izin, rapor, resmi tatil ve görev kayıtları sağlanmadığından geç kalma, erken çıkma, devamsızlık veya fazla mesai kararı verilmemiştir. Bu rapor devam sistemi kayıt kalitesini ve hesaplanabilir hareketleri gösterir.", styles["Warn"])]
    story += [p("Dosyaların gerçek tarih kapsamı", styles["H2TR"])]
    file_data = [["Dosya", "İlk hareket", "Son hareket", "Kayıt", "Gün"]]
    for item in file_stats:
        file_data.append([item["file"], fmt_dt(item["first"]), fmt_dt(item["last"]), fmt_num(item["count"]), fmt_num(item["days"])])
    story += [table(file_data, [31 * mm, 45 * mm, 45 * mm, 24 * mm, 20 * mm], aligns=["LEFT", "LEFT", "LEFT", "RIGHT", "RIGHT"])]
    story += [Spacer(1, 6 * mm), p(
        "Dosya adları yalnızca dışa aktarma veya kesim tarihini çağrıştırmaktadır. Özellikle 20260701.txt, 22.11.2024 - 01.07.2026 dönemini birlikte içerir.", styles["Callout"])]

    story += [PageBreak(), p("2. Personel bazında değerlendirme", styles["H1TR"])]
    story += [p(
        "Aşağıdaki tablo ham okumaları, ardışık kurala göre oluşan çiftleri ve veri kalitesi göstergelerini sunar. 'Geçerli saat', yalnızca 0-24 saat aralığındaki çiftlerin toplamıdır.", styles["BodyTR"])]
    person_data = [["Kart", "Personel", "Okuma", "Çift", "0-24 s çift", ">24 s", "Açık", "Geçerli saat", "Ort. s"]]
    for s in stats:
        person_data.append([
            f"{s['card']:05d}", s["name"], fmt_num(s["readings"]), fmt_num(s["pairs"]),
            fmt_num(s["valid_pairs"]), fmt_num(s["long_pairs"]), "Evet" if s["open"] else "Hayır",
            fmt_num(s["hours"], 1), fmt_num(s["avg"], 2),
        ])
    story += [table(person_data, [16*mm, 47*mm, 16*mm, 14*mm, 19*mm, 14*mm, 14*mm, 23*mm, 17*mm], font_size=6.5,
                    aligns=["CENTER", "LEFT", "RIGHT", "RIGHT", "RIGHT", "RIGHT", "CENTER", "RIGHT", "RIGHT"])]
    story += [Spacer(1, 5 * mm), p(
        "00009 ve 00016 satırları izlenebilirlik için ayrı gösterilmiştir; personel toplamında ikisi de Muhlise ÖZDENİZ'e aittir. İki kartın ham toplamı 921 okuma ve 460 tamamlanmış çifttir.", styles["Callout"])]
    story += [p("Okuma yoğunluğu", styles["H2TR"]), bar_chart(stats)]

    story += [PageBreak(), p("3. Bulgular ve istisnalar", styles["H1TR"])]
    story += [p("Açık kalan girişler", styles["H2TR"])]
    open_names = ", ".join(f"{s['card']:05d} {s['name'].split(' (')[0]}" for s in stats if s["open"])
    story += [p(
        f"Veri dönemi sonunda tek okumayla açık kalan {open_count} kart vardır: {open_names}. Bunlar kesin eksik çıkış olarak yorumlanmamalıdır; veri aktarımı sonraki hareketten önce kesilmiş olabilir.", styles["BodyTR"])]
    story += [p("Uzun çiftler", styles["H2TR"])]
    story += [p(
        f"Toplam {long_pairs} giriş-çıkış çifti 24 saati aşmaktadır. Ardışık eşleştirme kuralı korunmuş olmakla birlikte bu çiftler, eksik ara okuma veya kayıt boşluğu ihtimali nedeniyle süre hesabına alınmamıştır. En yüksek uzun çift sayıları Ercan IŞIK (65), Halit TİKEN (62) ve Şehmus TURGUT'ta (61) görülmüştür.", styles["BodyTR"])]
    exception_data = [["Kart", "Personel", ">24 saat çift", "Toplam çift", "İnceleme oranı"]]
    for s in sorted(stats, key=lambda x: x["long_pairs"], reverse=True)[:8]:
        ratio = 100 * s["long_pairs"] / s["pairs"] if s["pairs"] else 0
        exception_data.append([f"{s['card']:05d}", s["name"], s["long_pairs"], s["pairs"], f"%{fmt_num(ratio, 1)}"])
    story += [table(exception_data, [22*mm, 64*mm, 31*mm, 28*mm, 31*mm], font_size=7.7,
                    aligns=["CENTER", "LEFT", "RIGHT", "RIGHT", "RIGHT"]), Spacer(1, 6 * mm)]
    story += [p("Sistem genelindeki kayıtsız dönemler", styles["H2TR"])]
    gap_data = [
        ["Son kayıt günü", "Sonraki kayıt günü", "Tam kayıtsız gün", "Değerlendirme"],
        ["24.09.2024", "03.10.2024", "8", "İlk kurulum / veri başlangıcı olabilir"],
        ["28.04.2026", "11.05.2026", "12", "Sistem veya aktarım kesintisi incelenmeli"],
        ["19.05.2026", "01.07.2026", "42", "Kritik veri boşluğu; Haziran 2026 tamamen yok"],
    ]
    story += [table(gap_data, [33*mm, 37*mm, 31*mm, 75*mm], font_size=7.6, aligns=["CENTER", "CENTER", "RIGHT", "LEFT"])]
    story += [Spacer(1, 6 * mm), p(
        "Muhlise kart geçişi: 00009 son hareketi 18.01.2026 16:59, 00016 ilk hareketi 02.07.2026 08:59'dur. Arada yaklaşık 165 gün vardır. Bu kabul kullanıcı bilgisine ve çakışma olmamasına dayanır; personel özlük kaydıyla doğrulanması önerilir.", styles["Warn"])]

    story += [PageBreak(), p("4. Sonuç ve önerilen kontrol düzeni", styles["H1TR"])]
    story += [p(
        "Kayıt seti giriş-çıkış devam raporlaması için kullanılabilir; ancak eksik hareketler ve uzun veri boşlukları nedeniyle doğrudan bordro, ücret kesintisi veya disiplin işlemi dayanağı yapılmamalıdır. Önce vardiya ve izin kayıtlarıyla mutabakat kurulmalıdır.", styles["BodyTR"])]
    recs = [
        ("1", "Kart-personel eşleştirmesini sabitleyin", "00016 kartının Muhlise ÖZDENİZ'e ait olduğu personel kart ekranında da güncellenmeli; eski 00009 kartı pasif olarak saklanmalıdır."),
        ("2", "Günlük açık hareket kontrolü", "Her gün sonunda tek kalan girişler ve 24 saati aşan çiftler sorumlu personel tarafından açıklama koduyla kapatılmalıdır."),
        ("3", "Vardiya planını sisteme bağlayın", "Geç kalma, erken çıkma ve fazla mesai ancak vardiya başlangıç-bitiş saatleri tanımlandıktan sonra hesaplanmalıdır."),
        ("4", "Veri kesintisi alarmı", "24 saat boyunca hiçbir personel hareketi oluşmazsa sistem yöneticisine otomatik uyarı verilmelidir."),
        ("5", "Aylık mutabakat", "Aylık raporda ham okuma, eşleşen çift, açık giriş, uzun çift, izin ve manuel düzeltme sayıları birlikte gösterilmelidir."),
    ]
    for num, title, body in recs:
        block = Table([[p(num, styles["metric"]), p(f"<b>{title}</b><br/>{body}", styles["BodyTR"])]], colWidths=[14*mm, 160*mm])
        block.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), BLUE),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#D7E0E7")),
        ]))
        story += [block, Spacer(1, 3 * mm)]
    story += [Spacer(1, 4 * mm), p("Önerilen aylık rapor alanları", styles["H2TR"])]
    monthly = [
        ["Kimlik", "Dönem", "Giriş", "Çıkış", "Çalışma", "Açık", "Uzun çift", "İzin", "Açıklama"],
        ["Kart / ad", "Ay", "Adet", "Adet", "Saat", "Adet", "Adet", "Gün", "Onay notu"],
    ]
    story += [table(monthly, [28*mm, 18*mm, 18*mm, 18*mm, 22*mm, 18*mm, 22*mm, 16*mm, 34*mm], font_size=7.3,
                    aligns=["LEFT", "CENTER", "RIGHT", "RIGHT", "RIGHT", "RIGHT", "RIGHT", "RIGHT", "LEFT"])]
    story += [Spacer(1, 7 * mm), p(
        "Nihai kanaat: Veri seti kayıt hareketlerini izlemek için yeterli, kesin devam ve ücret hesabı için ise vardiya/izin entegrasyonu ve istisna onayı gerektirir.", styles["Callout"])]
    story += [p(
        "Hazırlama notu: Bu rapor, sağlanan TXT hareket kayıtları ile personel kart ekran görüntüsü esas alınarak 02.11.2026 tarihinde oluşturulmuştur. Hesaplamalar belirtilen ardışık okuma kuralına bağlıdır.", styles["SmallTR"])]

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(OUTPUT)


if __name__ == "__main__":
    build()

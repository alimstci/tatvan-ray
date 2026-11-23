from pathlib import Path
from datetime import datetime, date, timedelta
from collections import defaultdict
import calendar
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak


SOURCE = Path(r"C:\Users\win\Desktop\ögretmen evi")
OUTPUT = Path(r"C:\Users\win\.codex\visualizations\2026\11\02\01a19ba7-f613-7d72-a163-e931b0401430\output\pdf\ogretmen_evi_gunluk_geldi_gelmedi_raporu.pdf")

NAMES = {
    1: "Hasan ÇELİKAL", 2: "Eyüp AKBAŞ", 3: "Fahrettin DURSUN",
    4: "Metin ERTUĞRUL", 5: "Şehmus TURGUT", 6: "Halit TİKEN",
    7: "Halise YILDIZ", 8: "Yıldız TAYMUR", 9: "Muhlise ÖZDENİZ",
    10: "Ercan IŞIK", 11: "Çetin GARCAN", 12: "Felek BARABAY",
    13: "Remziye KAPUCU", 14: "Kadriye DEMİR", 15: "Betül KAYA",
}
CARD_TO_PERSON = {i: i for i in range(1, 16)}
CARD_TO_PERSON[16] = 9

MONTHS = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
WEEKDAYS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"]
LINE_RE = re.compile(r"^\d+,(?P<card>\d+),\d+ (?P<date>\d{4}/\d{2}/\d{2}) (?P<time>\d{2}:\d{2}:\d{2}) \d+$")


def setup_fonts():
    regular = Path(r"C:\Windows\Fonts\arial.ttf")
    bold = Path(r"C:\Windows\Fonts\arialbd.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("TR", str(regular)))
        pdfmetrics.registerFont(TTFont("TRB", str(bold)))
        return "TR", "TRB"
    return "Helvetica", "Helvetica-Bold"


FONT, BOLD = setup_fonts()
NAVY = colors.HexColor("#17324D")
BLUE = colors.HexColor("#2D78A6")
TEAL = colors.HexColor("#2A8C82")
PALE = colors.HexColor("#F3F7FA")
GREEN = colors.HexColor("#E7F4EF")
RED = colors.HexColor("#FCE9E7")
GRAY = colors.HexColor("#687680")


def parse_records():
    by_person_day = defaultdict(list)
    all_rows = []
    for path in sorted(SOURCE.glob("*.txt")):
        with path.open("r", encoding="utf-8-sig", errors="replace") as stream:
            for line_no, line in enumerate(stream, 1):
                match = LINE_RE.match(line.strip())
                if not match:
                    continue
                card = int(match.group("card"))
                person = CARD_TO_PERSON[card]
                dt = datetime.strptime(f"{match.group('date')} {match.group('time')}", "%Y/%m/%d %H:%M:%S")
                # Takvim günü doğrudan cihaz tarihinden alınır. 00:00 ve sonrası yeni gündür.
                by_person_day[(person, dt.date())].append(dt)
                all_rows.append((person, dt))
    for key in by_person_day:
        by_person_day[key].sort()
    return by_person_day, all_rows


def daterange(start, end):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def month_iter(start, end):
    y, m = start.year, start.month
    while (y, m) <= (end.year, end.month):
        yield y, m
        if m == 12:
            y, m = y + 1, 1
        else:
            m += 1


def fmt_int(value):
    return f"{value:,}".replace(",", ".")


def status_cell(readings):
    if not readings:
        return "GELMEDİ"
    pairs = []
    for idx in range(0, len(readings), 2):
        entry = readings[idx].strftime("%H:%M")
        exit_time = readings[idx + 1].strftime("%H:%M") if idx + 1 < len(readings) else "--"
        pairs.append(f"{entry}/{exit_time}")
    if len(pairs) <= 2:
        return "\n".join(pairs)
    return "\n".join(pairs[:2]) + f"\n+{len(pairs)-2} çift"


def footer(canvas, doc):
    canvas.saveState()
    w, h = landscape(A4)
    canvas.setStrokeColor(colors.HexColor("#CBD5DD"))
    canvas.line(13 * mm, 11 * mm, w - 13 * mm, 11 * mm)
    canvas.setFillColor(GRAY)
    canvas.setFont(FONT, 7)
    canvas.drawString(13 * mm, 6.8 * mm, "Saat biçimi: giriş/çıkış | --: çıkış okuması yok")
    canvas.drawRightString(w - 13 * mm, 6.8 * mm, f"Sayfa {doc.page}")
    canvas.restoreState()


def make_summary_table(rows, styles):
    data = [["Kart", "Personel", "İlk kayıt", "Son kayıt", "Geldiği gün", "Gelmediği gün"]]
    for row in rows:
        data.append([
            row["card"], row["name"], row["first"].strftime("%d.%m.%Y"), row["last"].strftime("%d.%m.%Y"),
            fmt_int(row["present"]), fmt_int(row["absent"]),
        ])
    t = Table(data, colWidths=[22*mm, 62*mm, 32*mm, 32*mm, 32*mm, 35*mm], repeatRows=1)
    t.setStyle(TableStyle([
        ("FONTNAME", (0,0), (-1,-1), FONT), ("FONTNAME", (0,0), (-1,0), BOLD),
        ("FONTSIZE", (0,0), (-1,-1), 7.6), ("TEXTCOLOR", (0,0), (-1,-1), NAVY),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white), ("BACKGROUND", (0,0), (-1,0), NAVY),
        ("GRID", (0,0), (-1,-1), 0.3, colors.HexColor("#CBD5DD")),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"), ("ALIGN", (0,1), (0,-1), "CENTER"),
        ("ALIGN", (2,1), (-1,-1), "CENTER"),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, PALE]),
        ("TOPPADDING", (0,0), (-1,-1), 3), ("BOTTOMPADDING", (0,0), (-1,-1), 3),
    ]))
    return t


def make_daily_table(year, month, days, by_person_day, active, styles):
    title = f"{MONTHS[month]} {year} - {days[0]}. gün ile {days[-1]}. gün"
    date_headers = []
    for day_num in days:
        d = date(year, month, day_num)
        date_headers.append(f"{day_num:02d}\n{WEEKDAYS[d.weekday()]}")
    data = [["Personel"] + date_headers]
    cell_states = {}
    for row_idx, person in enumerate(range(1, 16), 1):
        row = [NAMES[person]]
        for col_idx, day_num in enumerate(days, 1):
            d = date(year, month, day_num)
            if d < active[person][0] or d > active[person][1]:
                value = "-"
                state = "outside"
            else:
                readings = by_person_day.get((person, d), [])
                value = status_cell(readings)
                state = "present" if readings else "absent"
            row.append(value)
            cell_states[(col_idx, row_idx)] = state
        data.append(row)
    usable = 271 * mm
    name_w = 43 * mm
    day_w = (usable - name_w) / len(days)
    t = Table(data, colWidths=[name_w] + [day_w] * len(days), repeatRows=1, hAlign="LEFT")
    commands = [
        ("FONTNAME", (0,0), (-1,-1), FONT), ("FONTNAME", (0,0), (-1,0), BOLD),
        ("FONTNAME", (0,1), (0,-1), BOLD), ("FONTSIZE", (0,0), (-1,-1), 5.6),
        ("LEADING", (0,0), (-1,-1), 6.5), ("TEXTCOLOR", (0,0), (-1,-1), NAVY),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white), ("BACKGROUND", (0,0), (-1,0), NAVY),
        ("BACKGROUND", (0,1), (0,-1), colors.HexColor("#E5EDF3")),
        ("GRID", (0,0), (-1,-1), 0.25, colors.HexColor("#BFCBD4")),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"), ("ALIGN", (1,0), (-1,-1), "CENTER"),
        ("TOPPADDING", (0,0), (-1,-1), 3), ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING", (0,0), (-1,-1), 2), ("RIGHTPADDING", (0,0), (-1,-1), 2),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, PALE]),
    ]
    for (col, row), state in cell_states.items():
        if state == "present":
            commands.append(("BACKGROUND", (col,row), (col,row), GREEN))
        elif state == "absent":
            commands.append(("BACKGROUND", (col,row), (col,row), RED))
            commands.append(("TEXTCOLOR", (col,row), (col,row), colors.HexColor("#8A3131")))
        else:
            commands.append(("TEXTCOLOR", (col,row), (col,row), colors.HexColor("#9AA5AD")))
    t.setStyle(TableStyle(commands))
    return title, t


def build():
    by_person_day, all_rows = parse_records()
    start = min(dt.date() for _, dt in all_rows)
    end = max(dt.date() for _, dt in all_rows)
    person_rows = defaultdict(list)
    for person, dt in all_rows:
        person_rows[person].append(dt)
    active = {person: (min(x.date() for x in rows), max(x.date() for x in rows)) for person, rows in person_rows.items()}

    summary = []
    for person in range(1, 16):
        first, last = active[person]
        present = sum(1 for d in daterange(first, last) if by_person_day.get((person, d)))
        total = (last - first).days + 1
        cards = "00009 + 00016" if person == 9 else f"{person:05d}"
        summary.append({"card": cards, "name": NAMES[person], "first": first, "last": last, "present": present, "absent": total-present})

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="T", fontName=BOLD, fontSize=23, leading=27, textColor=NAVY, spaceAfter=8))
    styles.add(ParagraphStyle(name="S", fontName=FONT, fontSize=10, leading=15, textColor=GRAY, spaceAfter=9))
    styles.add(ParagraphStyle(name="H", fontName=BOLD, fontSize=14, leading=17, textColor=NAVY, spaceBefore=4, spaceAfter=6))
    styles.add(ParagraphStyle(name="B", fontName=FONT, fontSize=8.5, leading=12.5, textColor=NAVY, spaceAfter=5))
    styles.add(ParagraphStyle(name="M", fontName=BOLD, fontSize=12, leading=15, textColor=NAVY, spaceAfter=5))
    styles.add(ParagraphStyle(name="Note", fontName=FONT, fontSize=8, leading=11, textColor=NAVY, backColor=colors.HexColor("#EAF2F7"), borderColor=BLUE, borderWidth=0.7, borderPadding=7, spaceAfter=7))

    doc = SimpleDocTemplate(str(OUTPUT), pagesize=landscape(A4), leftMargin=13*mm, rightMargin=13*mm, topMargin=16*mm, bottomMargin=15*mm,
                            title="Öğretmen Evi Günlük Geldi Gelmedi Raporu", author="Giriş çıkış kayıt raporu")
    story = [Paragraph("Günlük Geldi / Gelmedi Raporu", styles["T"]),
             Paragraph(f"Tüm kayıt dönemi: {start.strftime('%d.%m.%Y')} - {end.strftime('%d.%m.%Y')}", styles["S"]),
             Paragraph("Raporlama kuralı", styles["H"]),
             Paragraph("Her personelin kayıtları takvim günü bazında değerlendirilmiştir. Gün içindeki 1. okuma giriş, 2. okuma çıkış; varsa 3. okuma yeni giriş, 4. okuma yeni çıkış olarak gösterilmiştir. Saat 00:00 ve sonrasındaki okumalar yeni takvim gününe aittir. O gün hiç okuma yoksa GELMEDİ yazılmıştır.", styles["Note"]),
             Paragraph("Muhlise ÖZDENİZ için 00009 ve 00016 kartlarının hareketleri tek personel altında birleştirilmiştir. Personelin ilk ve son kayıt tarihleri dışındaki günler '-' ile gösterilmiştir. Yeşil geldi, kırmızı gelmedi anlamındadır.", styles["B"]),
             Paragraph("Personel dönem özeti", styles["H"]), make_summary_table(summary, styles),
             ]

    for year, month in month_iter(start, end):
        _, last_day = calendar.monthrange(year, month)
        month_start = 1
        month_end = last_day
        if year == start.year and month == start.month:
            month_start = start.day
        if year == end.year and month == end.month:
            month_end = end.day
        segments = [list(range(month_start, min(15, month_end) + 1))]
        if month_end >= 16:
            segments.append(list(range(max(16, month_start), month_end + 1)))
        for days in segments:
            if not days:
                continue
            title, daily_table = make_daily_table(year, month, days, by_person_day, active, styles)
            story += [PageBreak(), Paragraph(title, styles["M"]),
                      Paragraph("Hücre biçimi: giriş/çıkış. Birden fazla vardiya varsa alt satırda sonraki çift gösterilir.", styles["B"]),
                      daily_table]

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUTPUT)


if __name__ == "__main__":
    build()

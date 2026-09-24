from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
)


ROOT = Path("/Users/mtahir/eveng_rocev2_mpls_vxlan_lab")
MD_PATH = ROOT / "LAB_CONFIGURATION_GUIDE.md"
PDF_PATH = ROOT / "LAB_CONFIGURATION_GUIDE.pdf"
IMG_PATH = ROOT / "docs" / "current-salvaged-topology.png"


def build_story(md_text: str):
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "TitleCustom",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=28,
        textColor=colors.HexColor("#17324d"),
        alignment=TA_CENTER,
        spaceAfter=18,
    )
    h1 = ParagraphStyle(
        "H1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#17324d"),
        spaceBefore=14,
        spaceAfter=8,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        spaceAfter=6,
    )
    bullet = ParagraphStyle(
        "Bullet",
        parent=body,
        leftIndent=14,
        firstLineIndent=-8,
    )
    code = ParagraphStyle(
        "Code",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=8,
        leading=10,
        leftIndent=8,
        rightIndent=8,
        backColor=colors.HexColor("#f3f5f7"),
        borderPadding=6,
        borderWidth=0.5,
        borderColor=colors.HexColor("#d5dbe1"),
        spaceBefore=4,
        spaceAfter=8,
    )

    story = []
    story.append(Paragraph("EVE-NG RoCEv2 / EVPN-VXLAN Lab Configuration Guide", title))
    story.append(
        Paragraph(
            "Current working topology, configuration intent, and validation reference for SPINE1, SPINE2, LEAF-1, LEAF-2, GPU-A, and GPU-B.",
            body,
        )
    )
    story.append(Spacer(1, 0.12 * inch))

    if IMG_PATH.exists():
        img = Image(str(IMG_PATH))
        img.drawHeight = 3.8 * inch
        img.drawWidth = 6.8 * inch
        story.append(img)
        story.append(Spacer(1, 0.12 * inch))
        story.append(
            Paragraph(
                "Current salvaged topology reference. The local management cloud is external to the included image.",
                body,
            )
        )
        story.append(PageBreak())

    lines = md_text.splitlines()
    in_code = False
    code_buf = []

    def flush_code():
        nonlocal code_buf
        if code_buf:
            story.append(Preformatted("\n".join(code_buf), code))
            code_buf = []

    for line in lines:
        if line.startswith("```"):
            if in_code:
                flush_code()
                in_code = False
            else:
                in_code = True
            continue

        if in_code:
            code_buf.append(line)
            continue

        if not line.strip():
            story.append(Spacer(1, 0.06 * inch))
            continue

        if line.startswith("# "):
            story.append(Paragraph(line[2:].strip(), title))
            continue

        if line.startswith("## "):
            story.append(Paragraph(line[3:].strip(), h1))
            continue

        if line.startswith("- "):
            story.append(Paragraph("• " + line[2:].strip(), bullet))
            continue

        if line[:2].isdigit() and line[2:4] == ". ":
            story.append(Paragraph(line.strip(), body))
            continue

        story.append(Paragraph(line, body))

    flush_code()
    return story


def add_page_number(canvas, doc):
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#5c6773"))
    canvas.drawRightString(7.5 * inch, 0.5 * inch, f"Page {doc.page}")


def main():
    md_text = MD_PATH.read_text()
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=letter,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.7 * inch,
        title="EVE-NG RoCEv2 EVPN-VXLAN Lab Configuration Guide",
        author="OpenAI Codex",
    )
    story = build_story(md_text)
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)


if __name__ == "__main__":
    main()

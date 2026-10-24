import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register Arial font supporting Cyrillic
font_path = "C:\\Windows\\Fonts\\arial.ttf"
font_bold_path = "C:\\Windows\\Fonts\\arialbd.ttf"

if os.path.exists(font_path):
    pdfmetrics.registerFont(TTFont('Arial', font_path))
if os.path.exists(font_bold_path):
    pdfmetrics.registerFont(TTFont('Arial-Bold', font_bold_path))

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Arial", 9)
        self.setFillColor(colors.HexColor("#6B7280"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, A4[1] - 36, "Odyssey Кредит Хаб — Умный кредитный кабинет предпринимателя")
            self.setStrokeColor(colors.HexColor("#E5E7EB"))
            self.setLineWidth(0.5)
            self.line(54, A4[1] - 42, A4[0] - 54, A4[1] - 42)

        # Footer
        page_text = f"Стр. {self._pageNumber} из {page_count}"
        self.drawRightString(A4[0] - 54, 36, page_text)
        self.drawString(54, 36, "Альфа-Банк & Changellenge Хакатон 2026")
        self.setStrokeColor(colors.HexColor("#E5E7EB"))
        self.setLineWidth(0.5)
        self.line(54, 48, A4[0] - 54, 48)
        
        self.restoreState()

def generate_pdf():
    pdf_path = "Odyssey_Credit_Hub_Overview.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Arial-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#EF3124"),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Arial',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#4B5563"),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Arial-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1F2937"),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Arial-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#374151"),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Arial',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#374151"),
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.5
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#111827"),
        backColor=colors.HexColor("#F3F4F6"),
        borderColor=colors.HexColor("#E5E7EB"),
        borderWidth=1,
        borderPadding=5,
        spaceBefore=4,
        spaceAfter=6,
        borderRadius=4
    )

    story = []

    # Title block
    story.append(Paragraph("Odyssey Кредит Хаб", title_style))
    story.append(Paragraph("Умный кредитный конвейер и кабинет предпринимателя для малого и микробизнеса", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#EF3124"), spaceAfter=10))

    # Section 1: Team & Overview
    story.append(Paragraph("1. О проекте и команде", h1_style))
    story.append(Paragraph("<b>Команда «Odyssey»:</b> Ананиев Егор, Мокеев Богдан, Сижажев Олег, Зайнетдинов Искандер.", body_style))
    story.append(Paragraph("<b>Хакатон:</b> Альфа-Банк & Changellenge 2026.", body_style))
    story.append(Paragraph("<b>Суть решения:</b> Комплексная цифровая экосистема корпоративного кредитования, объединяющая клиентский путь предпринимателя (от подачи заявки по ИНН до подписания и выдачи) и внутренний кредитный конвейер банка с автоматическим ML-скорингом, агрегатором Сравни.ру и ИИ-ассистентом.", body_style))

    # Section 2: Why We Are Better (Advantages)
    story.append(Paragraph("2. Конкурентные преимущества (Почему мы лучше других)", h1_style))
    advantages = [
        "<b>Сквозная автоматизация (End-to-End):</b> Полная связка личного кабинета клиента, автоматической проверки ФНС/ЕГРЮЛ, предиктивного ML-скоринга и рабочего места кредитного инспектора (Backoffice).",
        "<b>Обученная ML-модель на 387 952+ компаниях:</b> Ансамбль Gradient Boosting с ROC-AUC 0.872 и Gini 0.744, обученный на открытых данных ФНС/ГИР БО с экспертной разметкой (Risk Scoring Rules).",
        "<b>Гибридный ИИ-ассистент (AI-Советник):</b> Интеграция с GigaChat API и YandexGPT с интеллектуальным офлайн-режимом, который мгновенно адаптируется под контекст конкретной заявки и компании.",
        "<b>Полная автономность и Enterprise-стандарты:</b> Решение полностью container-ready (Docker Compose), не требует платных API или закрытых корпоративных систем Альфа-Банка, все внешние интеграции смоделированы профессионально.",
        "<b>Удобство для бизнеса:</b> Предпринимателю не нужна банковская экспертиза — система сама подбирает оптимальный продукт (оборотный кредит, кредитная линия, инвестиции) и рассчитывает график платежей."
    ]
    for adv in advantages:
        story.append(Paragraph(f"• {adv}", bullet_style))

    # Section 3: Repository & Navigation
    story.append(Paragraph("3. Репозиторий и навигация по проекту", h1_style))
    story.append(Paragraph("<b>GitHub Репозиторий:</b> Размещено с полной историей коммитов.", body_style))
    story.append(Paragraph("<b>Доступ для жюри:</b> Аккаунт жюри с правами доступа — <code>alfa-hack-2026</code>.", body_style))
    story.append(Paragraph("<b>Структура репозитория:</b>", body_style))
    story.append(Paragraph("• <code>app/</code> — Next.js 14 App Router (клиентский кабинет, мастер заявки, бэкофис, API).", bullet_style))
    story.append(Paragraph("• <code>lib/</code> — Бизнес-логика, кредитный конвейер, скоринг, моки, коннекторы ИИ.", bullet_style))
    story.append(Paragraph("• <code>prisma/</code> — Схема БД (PostgreSQL/SQLite), сиды данных и XML ФНС.", bullet_style))
    story.append(Paragraph("• <code>ml/</code> — Модели машинного обучения и скрипты обучения PD.", bullet_style))
    story.append(Paragraph("• <code>docs/</code> — Архитектурная схема, описание API и диаграмма состояний.", bullet_style))

    # Section 4: How to Download & Run
    story.append(Paragraph("4. Как скачать и запустить проект", h1_style))
    story.append(Paragraph("Проект полностью cloud-native и запускается одной командой через Docker:", body_style))
    
    docker_instructions = (
        "# 1. Клонируйте репозиторий\n"
        "git clone <url> && cd alfa-credit-hub\n\n"
        "# 2. Запустите в Docker (PostgreSQL + Приложение)\n"
        "docker-compose up -d\n\n"
        "# 3. Откройте в браузере:\n"
        "http://localhost:3000"
    )
    story.append(Paragraph(docker_instructions.replace('\n', '<br/>'), code_style))

    story.append(Paragraph("<b>Локальный запуск (без Docker):</b>", h2_style))
    local_instructions = (
        "npm install\n"
        "npm run db:push\n"
        "npm run db:import-xml\n"
        "npm run db:seed\n"
        "npm run dev"
    )
    story.append(Paragraph(local_instructions.replace('\n', '<br/>'), code_style))

    # Section 5: Contacts & Verification
    story.append(Paragraph("5. Сценарий проверки и контакты", h1_style))
    story.append(Paragraph("<b>Основной демонстрационный сценарий:</b>", body_style))
    story.append(Paragraph("1. Перейдите на <code>http://localhost:3000</code> и нажмите «Войти / Подать заявку».", bullet_style))
    story.append(Paragraph("2. Укажите ИНН (например, <code>7701234567</code> для ООО «Вектор» или выберите из базы).", bullet_style))
    story.append(Paragraph("3. Пройдите мастер подачи заявки: выберите «Кредитная линия», сумму 1 000 000 ₽, срок 12 мес.", bullet_style))
    story.append(Paragraph("4. Изучите личный кабинет предпринимателя (статус «Одобрено», скоринг 910/1000, график платежей).", bullet_style))
    story.append(Paragraph("5. Откройте рабочее место кредитного инспектора по адресу <code>/backoffice</code> для проверки заявки со стороны банка.", bullet_style))
    story.append(Paragraph("6. Задайте вопрос ИИ-ассистенту в правом углу экрана — он проанализирует финансы и ответит как кредитный директор.", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("<b>Контакты команды:</b> Команда Odyssey · Хакатон Альфа-Банк 2026", body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully created with Cyrillic support: {pdf_path}")

if __name__ == '__main__':
    generate_pdf()

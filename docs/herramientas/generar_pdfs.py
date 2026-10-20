"""Genera los PDF de entrega a partir del SRS y de capturas reales.
Requiere Python 3 y reportlab: python -m pip install reportlab.
Ejecutar desde cualquier carpeta; las rutas son relativas a este script.
"""
from pathlib import Path
import re
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parents[1]
GREEN=colors.HexColor('#234f3d'); INK=colors.HexColor('#28372b'); MUTED=colors.HexColor('#727d6b')
font=Path('/usr/share/fonts/truetype/dejavu')
if (font/'DejaVuSans.ttf').exists():
 pdfmetrics.registerFont(TTFont('Body',str(font/'DejaVuSans.ttf')))
 pdfmetrics.registerFont(TTFont('BodyBold',str(font/'DejaVuSans-Bold.ttf')))
 pdfmetrics.registerFontFamily('Body',normal='Body',bold='BodyBold',italic='Body',boldItalic='BodyBold')
else:
 # Helvetica está disponible en ReportLab para Windows/macOS sin fuentes instaladas.
 pdfmetrics.registerFontFamily('Helvetica',normal='Helvetica',bold='Helvetica-Bold',italic='Helvetica-Oblique',boldItalic='Helvetica-BoldOblique')
FONT='Body' if (font/'DejaVuSans.ttf').exists() else 'Helvetica'
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='Text',fontName=FONT,fontSize=9.2,leading=14,spaceAfter=8,textColor=INK))
styles.add(ParagraphStyle(name='TitleX',fontName=FONT,fontSize=34,leading=42,textColor=GREEN,spaceAfter=22))
styles.add(ParagraphStyle(name='Sub',fontName=FONT,fontSize=16,leading=24,textColor=MUTED,spaceAfter=22))
styles.add(ParagraphStyle(name='H2X',fontName=FONT,fontSize=15,leading=21,textColor=GREEN,spaceBefore=18,spaceAfter=10,keepWithNext=True))
styles.add(ParagraphStyle(name='H3X',fontName=FONT,fontSize=11,leading=16,textColor=GREEN,spaceBefore=11,spaceAfter=7,keepWithNext=True))
styles.add(ParagraphStyle(name='Cell',fontName=FONT,fontSize=8.1,leading=11.8,textColor=INK))
styles.add(ParagraphStyle(name='HeaderCell',parent=styles['Cell'],textColor=colors.white))
styles.add(ParagraphStyle(name='Caption',fontName=FONT,fontSize=9,leading=14,textColor=MUTED,spaceAfter=12))
W,H=595.28,841.89

def inline(text):
 text=escape(text).replace('&amp;#x20;',' ')
 text=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',text)
 text=re.sub(r'`([^`]+)`',r'<font color="#234f3d">\1</font>',text)
 return text

def footer(canvas,doc):
 canvas.setStrokeColor(colors.HexColor('#d7dfd0'));canvas.line(42,39,W-42,39)
 canvas.setFont(FONT,8);canvas.setFillColor(MUTED);canvas.drawString(42,26,'CoffeERP / Programación Web II / 23300748')
 canvas.drawRightString(W-42,26,str(doc.page))

def table(rows):
 n=len(rows[0]); widths=(([64,447] if rows[0][0]=='ID' else [150,361]) if n==2 else [115,210,186] if n==3 else [511/n]*n)
 data=[[Paragraph(inline(c),styles['HeaderCell'] if i==0 else styles['Cell']) for c in row] for i,row in enumerate(rows)]
 t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),GREEN),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#f3f6ee'),colors.white]),('LINEBELOW',(0,0),(-1,-1),.35,colors.HexColor('#dce4d5'))]))
 return t

def markdown_blocks(text):
 lines=text.splitlines();story=[];i=0
 while i<len(lines):
  line=lines[i].strip()
  if not line:i+=1;continue
  if line.startswith('```'):
   # El diagrama Mermaid se conserva editable en el SRS; versión descriptiva en PDF.
   if line=='```mermaid':
    story.append(Paragraph('Usuario → Angular SPA → Express API → middleware JWT/rol → servicios. Los servicios consultan MySQL y las APIs de PayPal Sandbox y Brevo.',styles['Text']))
   i+=1
   while i<len(lines) and not lines[i].startswith('```'):i+=1
   i+=1;continue
  if line.startswith('|'):
   rows=[]
   while i<len(lines) and lines[i].strip().startswith('|'):
    cells=[x.strip() for x in lines[i].strip().strip('|').split('|')]
    if not all(re.fullmatch(r':?-+:?',c.replace(' ','')) for c in cells):rows.append(cells)
    i+=1
   story.append(table(rows));story.append(Spacer(1,8));continue
  if line.startswith('# '):i+=1;continue
  if line.startswith('## '):story.append(Paragraph(inline(line[3:]),styles['H2X']));i+=1;continue
  if line.startswith('### '):story.append(Paragraph(inline(line[4:]),styles['H3X']));i+=1;continue
  para=[line];i+=1
  while i<len(lines) and lines[i].strip() and not lines[i].startswith(('#','|','```')):
   if re.match(r'^(\d+\.|-) ',lines[i]):break
   para.append(lines[i].strip());i+=1
  story.append(Paragraph(inline(' '.join(para)),styles['Text']))
 return story

def srs():
 title=[Spacer(1,70),Paragraph('COFFE ERP',styles['Caption']),Paragraph('Especificación<br/>de requisitos<br/>de software',styles['TitleX']),Paragraph('Versión simplificada para examen',styles['Sub']),Spacer(1,35)]
 for line in ['Santiago Gallardo Ruvalcaba','23300748 · Grupo 7A1','CETI Colomos · Desarrollo de Software','Programación Web II','Docente: Paola Fernanda Ponce Villalvazo','19 de octubre de 2026 · Versión 2.0']:
  title.append(Paragraph(escape(line),styles['Text']))
 title.extend([Spacer(1,28),Paragraph('Cinco módulos conectados · Seguridad con middleware<br/>PayPal Sandbox · Factura XML por correo',styles['Sub']),PageBreak()])
 text=(ROOT/'SRS.md').read_text();text=text[text.index('## 1. Propósito'):]
 SimpleDocTemplate(str(ROOT/'SRS-CoffeERP.pdf'),pagesize=(W,H),rightMargin=42,leftMargin=42,topMargin=42,bottomMargin=55,title='SRS CoffeERP',author='Santiago Gallardo Ruvalcaba').build(title+markdown_blocks(text),onFirstPage=footer,onLaterPages=footer)

def evidence():
 story=[Paragraph('Evidencias de<br/>funcionamiento',styles['TitleX']),Paragraph('CoffeERP · Examen de Programación Web II',styles['Sub'])]
 story.append(Paragraph('Santiago Gallardo Ruvalcaba · 23300748 · 7A1<br/>19 de octubre de 2026',styles['Text']))
 story.append(Paragraph('Capturas obtenidas de la aplicación ejecutada localmente con datos ficticios en SQL. Se demostró una venta en efectivo y la navegación protegida por roles. Las integraciones externas no se ejecutaron con credenciales reales.',styles['Text']))
 story.append(table([['Comprobación','Resultado'],['Compilación Angular','Completada sin errores'],['Pruebas SQL y HTTP','12 pruebas aprobadas; 0 fallos'],['PayPal y correo en pruebas','Respuestas externas controladas, sin cobros ni mensajes'],['Pago Sandbox y correo recibido','Pendientes de credenciales del alumno']]))
 screenshots=[('01-login.png','1. Acceso al sistema','Formulario de autenticación. No se muestran credenciales.'),('02-ventas.png','2. Ventas y carrito','Catálogo persistido, cantidades, total y datos ficticios de cliente. PayPal aparece pendiente de configuración.'),('03-compras.png','3. Compras y proveedores','Registro de proveedor y compra recibida/pagada; el backend registra entrada de inventario y egreso.'),('04-inventario.png','4. Inventario','Existencias, reservas, mínimo, edición de productos y bitácora de movimientos.'),('05-rrhh.png','5. Recursos humanos','Expediente básico y salario mensual registrado. No incluye cálculo fiscal de nómina.'),('06-finanzas.png','6. Finanzas y contabilidad','Libro de ingresos/egresos conectado con compras, ventas y salarios.'),('07-movil.png','7. Adaptación móvil','Vista de 390 píxeles. Captura completa de la pantalla; el contenido conserva desplazamiento vertical.'),('08-cajero.png','8. Acceso según rol','El cajero solo dispone de Ventas; el guard redirige el acceso a Finanzas. El backend verifica permisos por separado.')]
 for file,title,caption in screenshots:
  image=ROOT/'evidencias'/file
  if not image.exists():raise FileNotFoundError(image)
  story.extend([PageBreak(),Paragraph(title,styles['H2X']),Paragraph(caption,styles['Caption'])])
  iw,ih=ImageReader(str(image)).getSize();scale=min(511/iw,625/ih)
  story.append(Image(str(image),width=iw*scale,height=ih*scale))
 story.extend([PageBreak(),Paragraph('9. Pruebas y factura XML',styles['H2X']),Paragraph('La suite usa SQL y Express reales. Solo las respuestas de PayPal y Brevo se sustituyen por datos de prueba para verificar situaciones de error y recuperación.',styles['Text'])])
 text=(ROOT/'evidencias/pruebas.txt').read_text();summary=text[text.rfind('ℹ tests'):]
 story.append(Paragraph(inline(summary).replace('\n','<br/>'),styles['Text']))
 xml=(ROOT/'evidencias/factura-demo.xml').read_text()
 story.append(Paragraph('XML generado de una venta local pagada',styles['H3X']))
 story.append(Paragraph(escape(xml).replace('\n','<br/>'),ParagraphStyle('XML',parent=styles['Cell'],fontSize=7.7,leading=12)))
 story.append(Spacer(1,15));story.append(Paragraph('Pendiente para completar la evidencia externa: pagar con cuenta compradora Sandbox y guardar captura de la transacción; configurar remitente Brevo y mostrar recepción del correo con el XML adjunto. No se presentan resultados simulados como entregas reales.',styles['Text']))
 SimpleDocTemplate(str(ROOT/'Evidencias-CoffeERP.pdf'),pagesize=(W,H),rightMargin=42,leftMargin=42,topMargin=42,bottomMargin=55,title='Evidencias CoffeERP',author='Santiago Gallardo Ruvalcaba').build(story,onFirstPage=footer,onLaterPages=footer)
if __name__=='__main__':srs();evidence()

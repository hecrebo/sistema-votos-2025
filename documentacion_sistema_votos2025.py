from fpdf import FPDF
import os

# Archivos y títulos de sección
secciones = [
    ("README", "readme.md"),
    ("Correcciones Implementadas", "correcciones_implementadas.md"),
    ("Mejoras de Sincronización", "mejoras_sincronizacion.md"),
    ("Configuración del Servidor", "configuracion_servidor.md"),
    ("Sistema de Cache y Sincronización", "sistema_cache_sincronizacion.md"),
    ("Campos Sexo y Edad", "campos_sexo_edad.md"),
    ("Configuración de Firebase", "configuracion_firebase.md"),
    ("Optimizaciones", "optimizaciones.md"),
    ("Optimizaciones Implementadas", "optimizaciones_implementadas.md"),
    ("Manejo de Acentos y Ñ", "manejo_acentos_ñ.md")
]

class PDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return  # Sin encabezado en portada
        self.set_font('DejaVu', 'B', 12)
        self.set_text_color(102, 126, 234)
        self.cell(0, 10, 'Sistema de Votos 2025 - Documentación', 0, 1, 'C')
        self.ln(2)
        self.set_text_color(0,0,0)

    def portada(self, logo_path):
        self.add_page()
        if os.path.exists(logo_path):
            self.image(logo_path, x=80, y=30, w=50)
        self.set_y(90)
        self.set_font('DejaVu', 'B', 22)
        self.set_text_color(102, 126, 234)
        self.cell(0, 20, 'Sistema de Registro de Votos 2025', 0, 1, 'C')
        self.set_font('DejaVu', '', 16)
        self.set_text_color(118, 75, 162)
        self.cell(0, 12, 'Documentación Técnica y Funcional', 0, 1, 'C')
        self.ln(10)
        self.set_font('DejaVu', '', 12)
        self.set_text_color(60,60,60)
        self.multi_cell(0, 10, 'Incluye: instalación, configuración, optimizaciones, sincronización, validaciones, mejoras y soporte.\n\nVersión: 2025\nAutor: Equipo de Desarrollo', 0, 'C')
        self.ln(10)
        self.set_text_color(0,0,0)

    def titulo_seccion(self, titulo):
        self.set_font('DejaVu', 'B', 16)
        self.set_text_color(102, 126, 234)
        self.cell(0, 12, titulo, 0, 1, 'L')
        self.ln(2)
        self.set_text_color(0,0,0)

    def parrafo(self, texto):
        self.set_font('DejaVu', '', 11)
        self.set_text_color(30,30,30)
        self.multi_cell(0, 7, texto)
        self.ln(4)

pdf = PDF()
pdf.set_auto_page_break(auto=True, margin=18)
# Registrar fuente Unicode
pdf.add_font('DejaVu', '', 'DejaVuSans.ttf', uni=True)
pdf.add_font('DejaVu', 'B', 'DejaVuSans-Bold.ttf', uni=True)
pdf.portada('logo.jpg')

for titulo, archivo in secciones:
    with open(archivo, encoding='utf-8') as f:
        contenido = f.read()
    pdf.add_page()
    pdf.titulo_seccion(titulo)
    pdf.parrafo(contenido)

pdf.output('documentacion_sistema_votos2025.pdf')
print('PDF generado: documentacion_sistema_votos2025.pdf') 
from fpdf import FPDF

usuarios = [
    ["maria ordoñez","20161765"],
    ["reinaldo aguilar","12478928"],
    ["ana alvarez","12341809"],
    ["perla valera","7257936"],
    ["willy garcia","18639693"],
    ["iris marquez","16581399"],
    ["justo perez","18867076"],
    ["jose rodriguez","26389924"],
    ["nereyda guerrero","8823392"],
    ["yoiny betancourt","26804061"],
    ["erminia pulido","14713807"],
    ["jonas cordoba","25981075"],
    ["luis barcasnegra","14754397"],
    ["jose ledezma","11177021"],
    ["herminia leon","11353776"],
    ["darlis botello","9535936"],
    ["miguel hernandez","9658902"],
    ["hipolita molina","7073680"],
    ["fidel ernesto aguilar","7091235"],
    ["yraima pinto","13518010"],
    ["danny oviedo","13202357"],
    ["ileana gonzalez","15408274"],
    ["heidy avendaño","13087047"],
    ["liliana rodriguez","15853142"],
    ["leowaldo segovia","16243232"],
    ["lida sanchez","7933221"],
    ["nilda moreno","95089935"],
    ["carlos avendaño","4885476"],
    ["katiuska vergara","13455771"],
    ["gladys martinez","13219927"],
    ["dennys lopez","15654130"],
    ["yngrid fernandez","13455082"],
    ["mayra contreras","14989707"],
    ["nahima dalys","13954994"],
    ["javier ruiz","10730988"],
    ["yelida lara","11980191"],
    ["sugir muñoz","17530417"],
    ["amilkar jaspe","18520356"],
    ["milagros villegas","11098937"],
    ["reina rodriguez","14717754"],
    ["iris cabello","5268553"],
    ["fernanda quintero","14436761"],
    ["ysabel rivas","18532837"],
    ["yetsury sanchez","20759670"],
    ["layeth torres","19760118"],
    ["candida fernandez","13646202"],
    ["franyelis sequera","15609598"],
    ["manuel andres","12935261"],
    ["zayda hernandez","5098961"],
    ["francis contreras","15581776"],
    ["yurbi","9328821"],
    ["jesus guzman","11943006"],
    ["candelaria ramos","9848204"],
    ["jesus guzman","11987551"],
    ["lilia juarez","3362888"],
    ["yuneidy pinto","20699632"],
    ["elizabeth aguiar","19332022"],
    ["yoan aguiar","19722158"],
    ["albani herrera","23430503"],
    ["yosnaini escobar","18167183"],
    ["luis gutierrez","12005790"],
    ["maria heriberta tovar","5370901"],
    ["lisandra corona","24918796"],
    ["andreina fernandez","20951800"],
    ["milagros diaz","9692529"],
    ["jesus herrera","12118763"],
    ["yeldy barrios","15102216"],
    ["robersy vasquez","16864029"],
    ["santiago loyo","22005127"],
    ["erikun garcia","12185790"],
    ["efrain chirinos","12004184"],
    ["eneida marquez","11150347"],
    ["neida flores","13161125"],
    ["maryuri benaventa","13455009"],
    ["adriana la cruz","13900179"],
    ["registrador12","15124654"],
    ["registrador16","15205348"],
    ["registrador20","9679125"],
    ["ingrid cesar","14856360"],
    ["yosymar monsalve","19364063"],
    ["janeth fuentes","15258472"],
    ["luis oliveros","3020053"],
    ["carlos gutierrez","14325083"],
    ["miriam estrada","15259811"],
    ["ivan antequera","15407261"],
    ["elisa delgadon","8520238"],
    ["genesis medinas","21584875"],
    ["airam sambrano","20243594"],
    ["yugervi ruiz","16003254"],
    ["leonel sequera","12343202"]
]

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Listado de Usuarios Registradores', 0, 1, 'C')
        self.ln(2)
        self.set_font('Arial', 'B', 11)
        self.cell(10, 8, 'N°', 1, 0, 'C')
        self.cell(80, 8, 'Nombre de Usuario', 1, 0, 'C')
        self.cell(50, 8, 'Contraseña', 1, 1, 'C')
        self.set_font('Arial', '', 11)

pdf = PDF()
pdf.add_page()

for idx, row in enumerate(usuarios, 1):
    pdf.cell(10, 8, str(idx), 1, 0, 'C')
    pdf.cell(80, 8, row[0], 1, 0, 'L')
    pdf.cell(50, 8, row[1], 1, 1, 'C')

pdf.output('usuarios_registradores.pdf')
print('PDF generado: usuarios_registradores.pdf') 
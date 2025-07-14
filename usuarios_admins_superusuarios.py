from fpdf import FPDF

superusuarios = [
    ["superadmin_01", "Sup3r_Adm1n#2o24"],
    ["superadmin_02", "aB5!zP9$qW_sU"],
    ["superadmin_03", "rT7@eX3&yU_sU"],
    ["superadmin_04", "kL9#mN1!bV_sU"],
    ["superadmin_05", "zX8$cV6@fG_sU"]
]

administradores = [
    ["admin_01", "P@ssw0rd_Adm_01"],
    ["admin_02", "Adm_Secure_02!"],
    ["admin_03", "Gestion_2024_03"],
    ["admin_04", "4dminUser_p4ss"],
    ["admin_05", "Adm!n_Syst3m_05"],
    ["admin_06", "UserAdmin_06#"],
    ["admin_07", "Control_Panel_07"],
    ["admin_08", "Adm_Access_08$"],
    ["admin_09", "My_Admin_P@ss09"],
    ["admin_10", "P@ss_Adm_Global"]
]

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Listado de Superusuarios y Administradores', 0, 1, 'C')
        self.ln(2)

    def tabla(self, titulo, datos):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 8, titulo, 0, 1, 'L')
        self.set_font('Arial', 'B', 11)
        self.cell(10, 8, 'N°', 1, 0, 'C')
        self.cell(60, 8, 'Usuario', 1, 0, 'C')
        self.cell(60, 8, 'Contraseña', 1, 1, 'C')
        self.set_font('Arial', '', 11)
        for idx, row in enumerate(datos, 1):
            self.cell(10, 8, str(idx), 1, 0, 'C')
            self.cell(60, 8, row[0], 1, 0, 'L')
            self.cell(60, 8, row[1], 1, 1, 'C')
        self.ln(5)

pdf = PDF()
pdf.add_page()
pdf.tabla('Superusuarios', superusuarios)
pdf.tabla('Administradores', administradores)
pdf.output('usuarios_admins_superusuarios.pdf')
print('PDF generado: usuarios_admins_superusuarios.pdf') 
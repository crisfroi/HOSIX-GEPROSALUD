// Sermed Logistic Theme Configuration
export const theme = {
  brand: {
    name: 'SERMED LOGISTIC',
    description: 'Sistema Integral de Gestión Sanitaria',
  },
  colors: {
    primary: {
      light: 'hsl(218 91% 50%)',
      main: 'hsl(218 91% 41%)',      // #0066CC
      dark: 'hsl(218 91% 25%)',
      darker: 'hsl(218 91% 15%)',
    },
    secondary: {
      light: 'hsl(128 68% 65%)',
      main: 'hsl(128 68% 35%)',       // #00B050
      dark: 'hsl(128 68% 25%)',
    },
    status: {
      success: '#00B050',
      warning: '#FFC107',
      error: '#FF6B6B',
      info: '#0066CC',
    },
  },
  gradients: {
    sidebar: 'from-sermed-blue-dark to-sermed-blue',
    header: 'from-sermed-blue/5 to-sermed-green/5',
    button: 'from-sermed-blue to-sermed-green',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
};

export const medicalSpecialties = [
  'Medicina General',
  'Cirugía General',
  'Pediatría',
  'Cardiología',
  'Neurología',
  'Dermatología',
  'Oftalmología',
  'Otorrinolaringología',
  'Neumología',
  'Gastroenterología',
  'Urología',
  'Traumatología',
  'Psiquiatría',
  'Oncología',
  'Ginecología',
];

export const patientStatuses = {
  active: { label: 'Activo', color: '#00B050' },
  pending: { label: 'Pendiente', color: '#FFC107' },
  critical: { label: 'Crítico', color: '#FF6B6B' },
  discharged: { label: 'Alta', color: '#999999' },
};

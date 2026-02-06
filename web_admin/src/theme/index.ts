import { createTheme, alpha } from '@mui/material/styles';

// Agri-Tech Pro Color Palette
const PRIMARY = {
  main: '#2e7d32',
  light: '#60ad5e',
  dark: '#005005',
  contrastText: '#ffffff',
};

const SECONDARY = {
  main: '#f57c00', // Warning/Alerts
  light: '#ffad42',
  dark: '#bb4d00',
  contrastText: '#ffffff',
};

const SUCCESS = {
  main: '#00c853',
  light: '#5efc82',
  dark: '#009624',
};

const GREY = {
  0: '#FFFFFF',
  100: '#F9FAFB',
  200: '#F4F6F8',
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB',
  600: '#637381',
  700: '#454F5B',
  800: '#212B36',
  900: '#161C24',
};

// Custom Shadows
const customShadows = {
  z1: `0 1px 2px 0 ${alpha(GREY[900], 0.16)}`,
  z8: `0 8px 16px 0 ${alpha(GREY[900], 0.16)}`,
  z16: `0 16px 32px -4px ${alpha(GREY[900], 0.16)}`,
  card: `0 0 2px 0 ${alpha(GREY[900], 0.2)}, 0 12px 24px -4px ${alpha(GREY[900], 0.12)}`,
  dropdown: `0 0 2px 0 ${alpha(GREY[900], 0.24)}, -20px 20px 40px -4px ${alpha(GREY[900], 0.24)}`,
  primary: `0 8px 16px 0 ${alpha(PRIMARY.main, 0.24)}`,
};

const theme = createTheme({
  palette: {
    primary: PRIMARY,
    secondary: SECONDARY,
    success: SUCCESS,
    text: {
      primary: GREY[800],
      secondary: GREY[600],
      disabled: GREY[500],
    },
    background: {
      default: '#F4F6F8', // Dashboard Grey
      paper: '#FFFFFF',
    },
    divider: alpha(GREY[500], 0.24),
  },
  typography: {
    fontFamily: '"Public Sans", "Inter", "Roboto", sans-serif',
    h1: { fontWeight: 800, fontSize: '2.5rem' },
    h2: { fontWeight: 800, fontSize: '2rem' },
    h3: { fontWeight: 700, fontSize: '1.75rem' },
    h4: { fontWeight: 700, fontSize: '1.5rem' },
    h5: { fontWeight: 700, fontSize: '1.25rem' },
    h6: { fontWeight: 700, fontSize: '1rem' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body1: { lineHeight: 1.5 },
    body2: { lineHeight: 1.5 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          width: '100%',
          height: '100%',
          WebkitOverflowScrolling: 'touch',
        },
        body: {
          width: '100%',
          height: '100%',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: customShadows.card,
          borderRadius: 16,
          position: 'relative',
          zIndex: 0, // For background effects
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '24px 24px 0',
        },
        title: {
          fontWeight: 700,
          fontSize: '1.125rem',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        sizeLarge: {
          height: 48,
        },
        containedPrimary: {
          boxShadow: customShadows.primary,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: GREY[600],
          backgroundColor: GREY[200],
          fontWeight: 700,
        },
        root: {
          borderBottom: `1px dashed ${alpha(GREY[500], 0.24)}`,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-of-type td, &:last-of-type th': {
            border: 0,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

export default theme;

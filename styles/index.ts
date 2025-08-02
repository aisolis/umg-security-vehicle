// Color System
export const colors = {
  primary: {
    main: '#2C3E50',
    dark: '#1A252F',
    light: '#34495E',
  },
  secondary: {
    main: '#34495E',
    dark: '#2C3E50',
    light: '#5D6D7E',
  },
  accent: {
    main: '#F39C12',
    dark: '#E67E22',
    light: '#F4D03F',
  },
  success: {
    main: '#27AE60',
    dark: '#1E8449',
    light: '#58D68D',
  },
  error: {
    main: '#E74C3C',
    dark: '#C0392B',
    light: '#F1948A',
  },
  warning: {
    main: '#F39C12',
    dark: '#D68910',
    light: '#F8C471',
  },
  info: {
    main: '#3498DB',
    dark: '#2980B9',
    light: '#85C1E9',
  },
  neutral: {
    white: '#FFFFFF',
    light: '#F8F9FA',
    medium: '#6C757D',
    dark: '#2C2C2C',
    black: '#212529',
  },
};

// Typography System
export const typography = {
  heading: {
    large: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      lineHeight: 38,
    },
    medium: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 29,
    },
    small: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
  },
  body: {
    large: {
      fontSize: 18,
      fontWeight: 'normal' as const,
      lineHeight: 27,
    },
    medium: {
      fontSize: 16,
      fontWeight: 'normal' as const,
      lineHeight: 24,
    },
    small: {
      fontSize: 14,
      fontWeight: 'normal' as const,
      lineHeight: 21,
    },
  },
  button: {
    large: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      lineHeight: 22,
    },
    medium: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 19,
    },
    small: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 17,
    },
  },
  caption: {
    large: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 17,
    },
    medium: {
      fontSize: 12,
      fontWeight: 'normal' as const,
      lineHeight: 15,
    },
    small: {
      fontSize: 10,
      fontWeight: 'normal' as const,
      lineHeight: 12,
    },
  },
};

// Spacing System (8px base)
export const spacing = {
  xsmall: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 48,
  xxxlarge: 64,
};

// Shadow presets
export const shadows = {
  small: {
    shadowColor: colors.neutral.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Border Radius System
export const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 50,
};
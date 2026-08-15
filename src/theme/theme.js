import { createTheme } from '@mui/material/styles';
import { darkPalette, lightPalette } from '../palette';

export const lightTheme = createTheme({
  ...lightPalette,
});

export const darkTheme = createTheme({
  ...darkPalette,
});
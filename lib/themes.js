// Plantillas de diseño del libro y la portada
export const THEMES = {
  elegante: {
    name: 'Elegante',
    fonts: { head: 'Playfair Display', body: 'Lora' },
    googleFonts: 'Playfair+Display:ital,wght@0,500;0,700;0,800;1,500&family=Lora:ital,wght@0,400;0,600;1,400',
    accent: '#b8893b', ink: '#1f2330', paper: '#fffdf8', soft: '#f6efe2',
    cover: { bg: '#14213d', fg: '#f5ecd9', accent: '#d4a95a' },
  },
  moderno: {
    name: 'Moderno',
    fonts: { head: 'Montserrat', body: 'Source Serif 4' },
    googleFonts: 'Montserrat:wght@500;700;800;900&family=Source+Serif+4:ital,wght@0,400;0,600;1,400',
    accent: '#2f6df6', ink: '#16181d', paper: '#ffffff', soft: '#eef3ff',
    cover: { bg: '#2f6df6', fg: '#ffffff', accent: '#ffd23f' },
  },
  minimal: {
    name: 'Minimal',
    fonts: { head: 'Inter', body: 'Merriweather' },
    googleFonts: 'Inter:wght@400;600;800;900&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300',
    accent: '#e4572e', ink: '#111111', paper: '#ffffff', soft: '#f4f4f2',
    cover: { bg: '#f3f1ec', fg: '#111111', accent: '#e4572e' },
  },
  vibrante: {
    name: 'Vibrante',
    fonts: { head: 'Poppins', body: 'Nunito' },
    googleFonts: 'Poppins:wght@600;700;800;900&family=Nunito:ital,wght@0,400;0,700;1,400',
    accent: '#d6246e', ink: '#1d1433', paper: '#ffffff', soft: '#fdeef5',
    cover: { bg: '#ff5f6d', bg2: '#6a3df0', fg: '#ffffff', accent: '#ffe066' },
  },
  premium: {
    name: 'Premium',
    fonts: { head: 'Cormorant Garamond', body: 'EB Garamond' },
    googleFonts: 'Cormorant+Garamond:wght@500;600;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400',
    accent: '#9c7a3c', ink: '#1a1a1a', paper: '#fcfbf7', soft: '#f3efe6',
    cover: { bg: '#0b0b0f', fg: '#f1e7d0', accent: '#c9a45c' },
  },
  natural: {
    name: 'Natural',
    fonts: { head: 'DM Serif Display', body: 'DM Sans' },
    googleFonts: 'DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,400;0,600;0,700;1,400',
    accent: '#3f7d58', ink: '#1e2a22', paper: '#fdfdf9', soft: '#edf4ee',
    cover: { bg: '#2f5d46', fg: '#f6f3e8', accent: '#e9c46a' },
  },
};

export const PAGE_SIZES = {
  '6x9': { label: '6 x 9 in (Amazon KDP, recomendado)', width: '6in', height: '9in' },
  letter: { label: 'Carta 8.5 x 11 in (guías y workbooks)', width: '8.5in', height: '11in' },
  a4: { label: 'A4', width: '210mm', height: '297mm' },
  a5: { label: 'A5 (libro de bolsillo)', width: '148mm', height: '210mm' },
};

export function resolveDesign(design = {}) {
  const theme = THEMES[design.theme] || THEMES.elegante;
  const accent = design.accent || theme.accent;
  const cover = { ...theme.cover, ...(design.coverAccent ? { accent: design.coverAccent } : {}), ...(design.coverBg ? { bg: design.coverBg, bg2: design.coverBg } : {}) };
  return {
    key: THEMES[design.theme] ? design.theme : 'elegante',
    theme,
    accent,
    cover,
    layout: design.coverLayout || 'auto',
    image: design.coverImage || '',
    page: PAGE_SIZES[design.pageSize] || PAGE_SIZES['6x9'],
  };
}

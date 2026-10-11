/** Palette overrides stacked on the built-in light/dark themes. */
export const CELESTIAL_TOKENS = {
  // NOTE: `--dsw-alias-bg-base` is deliberately NOT listed here.
  //
  // The presenter writes this token as an inline style on <body>, and an inline
  // style outranks anything set through `overrideTokens` (same mechanism, later
  // write wins — and the presenter always writes last). The rule that actually
  // wins lives in `celestial.css`, where the value carries `!important` and so
  // outranks the inline declaration. Declaring it in both places would only
  // invite confusion about which one is live.
  '--dsw-alias-bg-layer-1': {
    light: 'color-mix(in srgb, #fbf7ec 92%, transparent)',
    dark: 'color-mix(in srgb, #101f34 92%, transparent)',
  },
  '--dsw-alias-bg-layer-2': {
    light: 'color-mix(in srgb, #fbf7ec 94%, transparent)',
    dark: 'color-mix(in srgb, #14263d 94%, transparent)',
  },
  '--dsw-alias-bg-layer-3': {
    light: 'color-mix(in srgb, #fffaf0 96%, transparent)',
    dark: 'color-mix(in srgb, #172c46 94%, transparent)',
  },
  // Desktop document preview (0.2.0-rc.2) paints PDF pages from these three
  // tokens. Leaving them unset keeps the stock bluish gray behind the skin.
  '--dsw-alias-bg-document-preview': { light: '#eee4cd', dark: '#071729' },
  '--dsw-alias-bg-document-selection': {
    light: 'color-mix(in srgb, rgb(65, 118, 230) 40%, transparent)',
    dark: 'color-mix(in srgb, rgb(103, 158, 254) 40%, transparent)',
  },
  '--dsw-alias-label-document-preview': { light: '#5c5348', dark: '#c7bda9' },
  '--dsw-alias-bg-module-platform': { light: '#eee4cd', dark: '#162943' },
  '--dsw-alias-bg-multi-select': { light: '#eee4cd', dark: '#162943' },
  '--dsw-alias-bg-skeleton': { light: 'rgb(48 43 37 / 0.06)', dark: 'rgb(241 232 213 / 0.08)' },
  '--dsw-alias-border-inverted': {
    light: 'color-mix(in srgb, #ae843b 42%, transparent)',
    dark: 'color-mix(in srgb, #c9a254 46%, transparent)',
  },
  '--dsw-alias-border-inverted2': {
    light: 'color-mix(in srgb, #ae843b 24%, transparent)',
    dark: 'color-mix(in srgb, #c9a254 26%, transparent)',
  },
  '--dsw-alias-brand-primary': { light: 'rgb(65, 118, 230)', dark: 'rgb(103, 158, 254)' },
  '--dsw-alias-brand-text': { light: 'rgb(65, 118, 230)', dark: 'rgb(103, 158, 254)' },
  '--dsw-alias-button-primary-fill': { light: 'rgb(65, 118, 230)', dark: 'rgb(103, 158, 254)' },
  '--dsw-alias-button-primary-hover': { light: 'rgb(103, 158, 254)', dark: 'rgb(65, 118, 230)' },
  '--dsw-alias-button-elevated-fill': {
    light: 'color-mix(in srgb, #fbf7ec 88%, transparent)',
    dark: 'color-mix(in srgb, #101f34 88%, transparent)',
  },
  '--dsw-alias-button-floating-fill': {
    light: 'color-mix(in srgb, #fbf7ec 90%, transparent)',
    dark: 'color-mix(in srgb, #101f34 90%, transparent)',
  },
  '--dsw-alias-button-floating-hover': {
    light: 'color-mix(in srgb, rgb(228, 237, 253) 42%, #fbf7ec)',
    dark: 'color-mix(in srgb, rgb(52, 65, 91) 54%, #101f34)',
  },
  '--dsw-alias-interactive-bg-active': {
    light: 'color-mix(in srgb, rgb(65, 118, 230) 13%, transparent)',
    dark: 'color-mix(in srgb, rgb(103, 158, 254) 15%, transparent)',
  },
  '--dsw-alias-interactive-bg-hover-accent': {
    light: 'color-mix(in srgb, rgb(65, 118, 230) 14%, transparent)',
    dark: 'color-mix(in srgb, rgb(103, 158, 254) 18%, transparent)',
  },
  '--dsw-alias-interactive-bg-hover-solid': {
    light: 'color-mix(in srgb, rgb(228, 237, 253) 58%, #fbf7ec)',
    dark: 'color-mix(in srgb, rgb(52, 65, 91) 54%, #101f34)',
  },
  '--dsw-alias-interactive-bg-hover': {
    light: 'color-mix(in srgb, rgb(65, 118, 230) 7%, transparent)',
    dark: 'color-mix(in srgb, rgb(103, 158, 254) 8%, transparent)',
  },
  '--dsw-alias-label-primary': { light: '#302b25', dark: '#f1e8d5' },
  '--dsw-alias-label-primary-dimmed': { light: '#493f35', dark: '#ded3bd' },
  '--dsw-alias-label-primary-bluish': { light: 'rgb(14, 48, 116)', dark: '#dce5ff' },
  '--dsw-alias-label-secondary': { light: '#5c5348', dark: '#c7bda9' },
  '--dsw-alias-label-tertiary': { light: '#73695c', dark: '#a79d89' },
  '--dsw-alias-label-caption': { light: '#8a7d6b', dark: '#8e98a8' },
  '--dsw-specific-bubble': {
    light: 'color-mix(in srgb, rgb(228, 237, 253) 72%, #fbf7ec)',
    dark: 'color-mix(in srgb, rgb(52, 65, 91) 72%, #101f34)',
  },
  '--dsw-specific-input-major': { light: '#fbf7ec', dark: '#14263d' },
  '--dsw-specific-menu': { light: '#fbf7ec', dark: '#14263d' },
  '--dsw-specific-selector': { light: '#eee4cd', dark: '#162943' },
  '--dsw-specific-sidebar-fill': {
    light: 'color-mix(in srgb, #f7efdc 62%, transparent)',
    dark: 'color-mix(in srgb, #0d1c30 62%, transparent)',
  },
  '--dsw-specific-sidebar-nav-item-active': {
    light: 'color-mix(in srgb, rgb(228, 237, 253) 58%, #fbf7ec)',
    dark: 'color-mix(in srgb, rgb(52, 65, 91) 58%, #101f34)',
  },
  '--dsw-specific-sidebar-nav-item-hover': {
    light: 'rgb(48 43 37 / 0.055)',
    dark: 'rgb(241 232 213 / 0.07)',
  },
  '--dsw-specific-tip': { light: '#eee4cd', dark: '#172c46' },
} as const

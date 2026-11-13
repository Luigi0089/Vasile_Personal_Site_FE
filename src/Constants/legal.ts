/*
 * Dati legali condivisi da avviso cookie, cookie policy e informativa privacy.
 *
 * Il titolare è una persona fisica (nessuna partita IVA, ragione sociale o sede legale):
 * per questo qui non ci sono P.IVA, REA o indirizzo di sede.
 */
export const LEGAL_CONFIG = {

  controller: {
    name: 'Luigi Francesco Vasile',
    email: 'luigifravasile@gmail.com'
  },

  /*
   * Incrementa la versione quando le informative cambiano in modo sostanziale:
   * l'avviso cookie ricomparirà a chi aveva già chiuso quello precedente.
   */
  policyVersion: '1.0',

  noticeStorageKey: 'cookie-notice-acknowledged',

  lastUpdate: 'novembre 2026',

  externalPolicies: {
    garante: 'https://www.garanteprivacy.it/',
    garanteCookie: 'https://www.garanteprivacy.it/faq/cookie',
    googleFonts: 'https://fonts.google.com/faq#privacy',
    jsDelivr: 'https://www.jsdelivr.com/terms/privacy-policy'
  }

} as const;

/* Audit-Plus · V4 · Debug hook (99_debug) */

import { hub } from '../hub.js';
import { A } from '../data/05-accounts.js';
import { CUR } from '../core/03-data-engine.js';
import { G, PROCS, RISKS, SRCN, V, WP } from '../views/05-indexes.js';
import { CSUG, clsOf, clsResolve } from './30-tb-v4.js';
import { CT, XP, ctTree } from './32-catalog.js';

/* ===== 99_debug.js ===== */
/* test hook: exposes internals only when localStorage meap.debug=1 */
try {
  if (localStorage.getItem('meap.debug') === '1') {
    window.__V4 = {
      get CUR() {
        return CUR;
      },
      CSUG,
      clsOf,
      clsResolve,
      TBSTORE: hub.TBSTORE,
      tbMapOf: hub.tbMapOf,
      G,
      CT,
      XP,
      ctTree,
      wpSt4: hub.wpSt4,
      catProg: hub.catProg,
      PROCS,
      SRCN,
      RISKS,
      WP: typeof WP !== 'undefined' ? WP : null,
      A,
      V,
      BLOCKS: hub.BLOCKS,
    };
  }
} catch (e) {
  /* storage blocked */
}

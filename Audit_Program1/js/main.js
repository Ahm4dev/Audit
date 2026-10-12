/* Audit-Plus · entry point.
   Modules are evaluated in exactly the order below (the former <script> order). Every import points BACKWARD in this list;
   references that point forward (or write across modules) go through the tiny hub in ./hub.js. */
import './hub.js';
import './data/01-assertions-procedure-types.js';
import './data/02-statuses-workflow-kinds.js';
import './data/03-evidence-deficiency-sampling.js';
import './data/04-phases.js';
import './data/05-accounts.js';
import './data/06-cycles-it-components.js';
import './data/07-working-papers.js';
import './data/08-disclosures-compliance.js';
import './data/09-document-templates.js';
import './data/10-fs-classification.js';
import './data/11-catalog.js';
import './data/12-forms-requests.js';
import './data/13-area-extras.js';
import './data/14-pbc.js';
import './data/15-pbc-lib-a.js';
import './data/16-pbc-lib-b.js';
import './data/17-pbc-lib-c.js';
import './data/18-pbc-lib-d.js';
import './data/19-pbc-lib-e.js';
import './data/20-pbc-lib-f.js';
import './data/21-iq-lib.js';
import './core/01-utils-i18n-storage.js';
import './core/02-auth.js';
import './core/03-data-engine.js';
import './ui/04-ui-primitives.js';
import './views/05-indexes.js';
import './views/06-dashboard.js';
import './views/07-master-program.js';
import './views/08-financial-statements.js';
import './views/09-cycles.js';
import './views/10-explorer.js';
import './views/11-risks-rcm-assertions.js';
import './views/12-sampling-materiality.js';
import './views/13-checklists.js';
import './views/14-isa-documentation.js';
import './modules/15-working-papers.js';
import './modules/16-relations.js';
import './modules/17-forms-letters-reports.js';
import './modules/18-file-writers.js';
import './modules/19-tb-worker.js';
import './modules/20-trial-balance.js';
import './modules/21-approvals.js';
import './modules/22-backups.js';
import './modules/23-exports.js';
import './modules/24-je-testing.js';
import './modules/25-search.js';
import './modules/26-selftest.js';
import './modules/27-conflict-detection.js';
import './app/28-gate-router-settings.js';
import './app/29-events-lifecycle.js';
import './v4/30-tb-v4.js';
import './v4/31-calc.js';
import './v4/32-catalog.js';
import './v4/33-areas.js';
import './v4/34-sampling.js';
import './v4/35-extras.js';
import './v4/36-financial-statements.js';
import './v4/37-analytics-hub.js';
import './v4/38-pbc.js';
import './v4/39-references.js';
import './v4/40-shell.js';
import './v4/41-integration.js';
import './v4/42-quality.js';
import './v4/43-debug-hook.js';
import './v4/44-simplify.js';
import './v8/50-pbc-core.js';
import './v8/51-pbc-view.js';
import './v8/52-pbc-actions.js';
import './v8/53-pbc-io.js';
import './v8/54-iq.js';
import './v8/55-shell.js';
import './v10/60-xlsx-rich.js';
import './v10/61-export-dom.js';
import './v10/62-export-ui.js';
import './v10/63-cf-pages.js';
import './v10/64-sidebar.js';
import './v10/65-risk-filter.js';
import './v10/66-company-delete.js';
import './v10/70-i18n-engine.js';
import './app/44-main.js';
import { PREF } from './core/01-utils-i18n-storage.js';
import { CO, createEngagement } from './core/03-data-engine.js';
import { SELFTEST } from './modules/26-selftest.js';
import { hub } from './hub.js';

/* Test/debug hook: opening the app with ?ap-debug exposes a few internals as window.__AP (used by tests/smoke.py). */
if (/[?&]ap-debug\b/.test(location.search)) {
  window.__AP = {
    get CO() {
      return CO;
    },
    get createEngagement() {
      return createEngagement;
    },
    get SAVER() {
      return hub.SAVER;
    },
    get SELFTEST() {
      return SELFTEST;
    },
    get route() {
      return hub.route;
    },
    get PREF() {
      return PREF;
    },
    get XT() {
      return hub.XT;
    },
  };
}

/* ============================================
   DELTA BLACK — MAIN ENTRY POINT
   v2 — Fixed boot sequence, screen routing,
   event binding order, and Firebase race condition
   ============================================ */

// ============================================
// BOOT — runs after DOM + all scripts loaded
// ============================================
function deltaBlackBoot() {

    // Step 1: Show welcome screen immediately (no flicker)
    DB_Utils.showScreen('welcome-screen');

    // Step 2: Bind all UI events FIRST (no Firebase needed)
    deltaBlackBindEvents();

    // Step 3: Init Firebase / storage in background
    DB_Storage.initialize()
        .then(function() {

            // Step 4: Check if user already has a session on this device
            var session = DB_Auth.checkExistingSession();

            if (session) {
                // Re-validate the session against Firebase
                // (in case admin deleted the user since last login)
                return DB_Storage.getUserByAgentNumber(session.user.agentNumber)
                    .then(function(freshUser) {
                        if (freshUser) {
                            // Session is valid — route directly to dashboard
                            if (freshUser.role === 'admin') {
                                DB_Admin.showDashboard(freshUser);
                            } else {
                                DB_User.showDashboard(freshUser);
                            }
                        } else {
                            // User no longer exists — clear stale session
                            DB_Storage.clearCurrentUser();
                            DB_Welcome.init();
                        }
                    });
            } else {
                // No session — show welcome
                DB_Welcome.init();
            }

        })
        .catch(function(err) {
            console.error('[Delta Black] Boot error:', err);
            // Even on Firebase error, welcome screen must work
            DB_Welcome.init();
        });
}

// ============================================
// ALL EVENT BINDINGS
// Runs synchronously — no Firebase dependency
// ============================================
function deltaBlackBindEvents() {

    // ---- Welcome: Enter System ----
    var btnEnter = document.getElementById('btn-enter');
    if (btnEnter) {
        btnEnter.addEventListener('click', function() {
            DB_Welcome.enterSystem();
        });
    }

    // ---- Login: Authenticate button ----
    var btnAuth = document.getElementById('btn-auth');
    if (btnAuth) {
        btnAuth.addEventListener('click', function() {
            deltaBlackDoLogin();
        });
    }

    // ---- Login: Enter key on any field ----
    ['agent-number', 'barcode', 'nickname'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
            el.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') deltaBlackDoLogin();
            });
            el.addEventListener('input', function() {
                DB_Utils.setText('login-error', '');
            });
        }
    });

    // ---- User dashboard: hamburger menu ----
    var btnUserMenu = document.getElementById('btn-user-menu');
    if (btnUserMenu) {
        btnUserMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            DB_User.toggleMenu();
        });
    }

    // ---- User dashboard: submit answer ----
    var btnSubmitAnswer = document.getElementById('btn-submit-answer');
    if (btnSubmitAnswer) {
        btnSubmitAnswer.addEventListener('click', function() {
            DB_User.submitAnswer();
        });
    }

    // ---- User dashboard: Enter key in answer textarea ----
    var userAnswer = document.getElementById('user-answer');
    if (userAnswer) {
        userAnswer.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                DB_User.submitAnswer();
            }
        });
    }

    // ---- User logout ----
    var btnUserLogout = document.getElementById('btn-user-logout');
    if (btnUserLogout) {
        btnUserLogout.addEventListener('click', function() {
            DB_Auth.logout();
        });
    }

    // ---- Admin: all panel events ----
    DB_Admin.init();

    // ---- Global: close dropdowns when clicking outside ----
    document.addEventListener('click', function(e) {
        var userMenu    = document.getElementById('user-menu');
        var btnUMenu    = document.getElementById('btn-user-menu');
        var adminMenu   = document.getElementById('admin-menu');
        var btnAMenu    = document.getElementById('btn-admin-menu');

        if (userMenu && btnUMenu &&
            !userMenu.contains(e.target) &&
            !btnUMenu.contains(e.target)) {
            userMenu.classList.add('hidden');
        }
        if (adminMenu && btnAMenu &&
            !adminMenu.contains(e.target) &&
            !btnAMenu.contains(e.target)) {
            adminMenu.classList.add('hidden');
        }
    });
}

// ============================================
// LOGIN HANDLER
// Separated so both button click and Enter key
// call the exact same code path
// ============================================
function deltaBlackDoLogin() {
    var btn = document.getElementById('btn-auth');
    if (btn) { btn.disabled = true; btn.textContent = 'AUTHENTICATING...'; }

    DB_Auth.authenticate()
        .then(function(result) {
            if (btn) { btn.disabled = false; btn.textContent = 'AUTHENTICATE'; }
            if (!result) return;

            if (result.role === 'admin') {
                DB_Admin.showDashboard(result.user);
            } else {
                DB_User.showDashboard(result.user);
            }
        })
        .catch(function(err) {
            if (btn) { btn.disabled = false; btn.textContent = 'AUTHENTICATE'; }
            console.error('[Delta Black] Login error:', err);
            DB_Utils.setText('login-error', 'SYSTEM ERROR — TRY AGAIN');
        });
}

// ============================================
// ENTRY POINT
// Works on all hosting platforms — no IIFE,
// no DOMContentLoaded race condition
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', deltaBlackBoot);
} else {
    deltaBlackBoot();
}

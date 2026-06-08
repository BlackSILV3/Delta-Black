/* ============================================
   DELTA BLACK — MAIN ENTRY POINT
   App bootstrap: Firebase init, session check,
   welcome & login event wiring
   ============================================ */

(function() {
    'use strict';

    // ============================================
    // BOOT SEQUENCE
    // ============================================

    function boot() {
        // 1. Initialize Firebase + storage layer
        DB_Auth.init().then(function() {

            // 2. Check for an existing session
            var session = DB_Auth.checkExistingSession();

            if (session) {
                // Returning user — route directly
                if (session.role === 'admin') {
                    DB_Admin.showDashboard(session.user);
                } else {
                    DB_User.showDashboard(session.user);
                }
            } else {
                // No session — start at welcome screen
                DB_Welcome.init();
                DB_Utils.showScreen('welcome-screen');
            }

        }).catch(function(err) {
            console.error('Delta Black boot error:', err);
            // Fallback: show welcome even on error
            DB_Welcome.init();
            DB_Utils.showScreen('welcome-screen');
        });

        // 3. Wire up all modules
        DB_Admin.init();
        bindGlobalEvents();
    }

    // ============================================
    // GLOBAL EVENT BINDINGS
    // (Welcome + Login screens — always present in DOM)
    // ============================================

    function bindGlobalEvents() {

        // --- Welcome: Enter System button ---
        var btnEnter = document.getElementById('btn-enter');
        if (btnEnter) {
            btnEnter.addEventListener('click', function() {
                DB_Welcome.enterSystem();
            });
        }

        // --- Login: Authenticate button ---
        var btnAuth = document.getElementById('btn-auth');
        if (btnAuth) {
            btnAuth.addEventListener('click', function() {
                DB_Login.handleLogin();
            });
        }

        // --- Login: Allow Enter key to submit ---
        var loginInputs = [
            document.getElementById('agent-number'),
            document.getElementById('barcode'),
            document.getElementById('nickname')
        ];
        loginInputs.forEach(function(input) {
            if (input) {
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        DB_Login.handleLogin();
                    }
                });
            }
        });

        // --- User dashboard: Hamburger menu ---
        var btnUserMenu = document.getElementById('btn-user-menu');
        if (btnUserMenu) {
            btnUserMenu.addEventListener('click', function(e) {
                e.stopPropagation();
                DB_User.toggleMenu();
            });
        }

        // --- User dashboard: Submit answer ---
        var btnSubmitAnswer = document.getElementById('btn-submit-answer');
        if (btnSubmitAnswer) {
            btnSubmitAnswer.addEventListener('click', function() {
                DB_User.submitAnswer();
            });
        }

        // --- User dashboard: Textarea Enter (Shift+Enter = newline) ---
        var userAnswer = document.getElementById('user-answer');
        if (userAnswer) {
            userAnswer.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    DB_User.submitAnswer();
                }
            });
        }

        // --- User logout ---
        var btnUserLogout = document.getElementById('btn-user-logout');
        if (btnUserLogout) {
            btnUserLogout.addEventListener('click', function() {
                DB_Auth.logout();
            });
        }

        // --- Close user menu when clicking outside ---
        document.addEventListener('click', function(e) {
            var userMenu = document.getElementById('user-menu');
            var btnUserMenuEl = document.getElementById('btn-user-menu');
            if (userMenu && btnUserMenuEl &&
                !userMenu.contains(e.target) &&
                !btnUserMenuEl.contains(e.target)) {
                userMenu.classList.add('hidden');
            }
        });

        // --- Clear login error when user starts typing ---
        var loginFields = ['agent-number', 'barcode', 'nickname'];
        loginFields.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', function() {
                    DB_Utils.setText('login-error', '');
                });
            }
        });
    }

    // ============================================
    // WAIT FOR DOM READY THEN BOOT
    // ============================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();

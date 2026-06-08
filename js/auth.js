/* ============================================
   DELTA BLACK — AUTHENTICATION
   Fixed: Admin login no longer depends on the
   admin record existing in Firebase first.
   Credentials are validated against config
   directly — works in editor preview AND live.
   ============================================ */

const DB_Auth = {

    isAdmin: function(agentNumber, barCode, nickname) {
        return agentNumber === DB_CONFIG.ADMIN.agentNumber &&
               barCode     === DB_CONFIG.ADMIN.barCode &&
               nickname    === DB_CONFIG.ADMIN.name;
    },

    validateCredentials: function(agentNumber, barCode, nickname) {
        return DB_Storage.getUserByAgentNumber(agentNumber).then(function(user) {
            if (user && user.barCode === barCode && user.nickname === nickname) {
                return user;
            }
            return null;
        });
    },

    authenticate: function() {
        var self = this;
        var agentNumber = DB_Utils.getValue('agent-number');
        var barCode     = DB_Utils.getValue('barcode');
        var nickname    = DB_Utils.getValue('nickname');
        var errorMsg    = document.getElementById('login-error');

        if (!agentNumber || !barCode || !nickname) {
            errorMsg.textContent = 'ALL FIELDS REQUIRED — ACCESS DENIED';
            return Promise.resolve(null);
        }

        // ── ADMIN CHECK ──────────────────────────────────────
        // Validated directly against config — never depends on
        // Firebase having the admin record seeded yet.
        if (this.isAdmin(agentNumber, barCode, nickname)) {
            var adminUser = {
                agentNumber: DB_CONFIG.ADMIN.agentNumber,
                barCode:     DB_CONFIG.ADMIN.barCode,
                nickname:    DB_CONFIG.ADMIN.name,
                name:        DB_CONFIG.ADMIN.name,
                role:        'admin',
                profile:     'System Administrator',
                grades:      [],
                levels:      [],
                badges:      [],
                lastLogin:   new Date().toISOString()
            };

            // Save/update admin record in Firebase (best-effort — don't block login)
            DB_Storage.saveUser(adminUser).catch(function(e) {
                console.warn('[Delta Black] Could not sync admin to Firebase:', e);
            });

            // Immediately set session and return — no Firebase wait
            DB_Storage.setCurrentUser(adminUser);
            return Promise.resolve({ user: adminUser, role: 'admin' });
        }

        // ── AGENT CHECK ──────────────────────────────────────
        // Registered agents must exist in Firebase (admin created them)
        return this.validateCredentials(agentNumber, barCode, nickname)
            .then(function(user) {
                if (user) {
                    user.lastLogin = new Date().toISOString();
                    return DB_Storage.updateUser(user).then(function() {
                        DB_Storage.setCurrentUser(user);
                        return { user: user, role: user.role || 'user' };
                    });
                }

                // No match found
                errorMsg.textContent = 'INVALID CREDENTIALS — ACCESS DENIED';
                var form = document.querySelector('.login-form');
                if (form) {
                    form.style.animation = 'none';
                    setTimeout(function() {
                        form.style.animation = 'shake 0.5s ease';
                    }, 10);
                }
                return null;
            })
            .catch(function(err) {
                console.error('[Delta Black] Auth error:', err);
                errorMsg.textContent = 'CONNECTION ERROR — CHECK NETWORK';
                return null;
            });
    },

    logout: function() {
        DB_Storage.clearCurrentUser();
        DB_Utils.clearValue('agent-number');
        DB_Utils.clearValue('barcode');
        DB_Utils.clearValue('nickname');
        DB_Utils.setText('login-error', '');

        var userMenu  = document.getElementById('user-menu');
        var adminMenu = document.getElementById('admin-menu');
        if (userMenu)  userMenu.classList.add('hidden');
        if (adminMenu) adminMenu.classList.add('hidden');

        DB_Utils.showScreen('welcome-screen');
    },

    checkExistingSession: function() {
        var currentUser = DB_Storage.getCurrentUser();
        if (currentUser) {
            return { user: currentUser, role: currentUser.role || 'user' };
        }
        return null;
    },

    init: function() {
        return DB_Storage.initialize();
    }
};

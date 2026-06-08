/* ============================================
   DELTA BLACK — ADMIN DASHBOARD
   Wires up the full admin panel: tabs, sidebar,
   agent list, and all admin event listeners
   ============================================ */

const DB_Admin = {

    // ============================================
    // SHOW DASHBOARD
    // ============================================

    showDashboard: function(user) {
        DB_Storage.setCurrentUser(user);
        DB_Utils.showScreen('admin-dashboard');

        // Set admin display name
        DB_Utils.setText('admin-display-name', user.nickname || 'Delta Black');

        // Load all data
        this.loadSidebar();
        DB_Questions.loadSent();
        DB_Users.loadTable();
        DB_Content.updateSelects();
        DB_Responses.load();

        // Start real-time agent sidebar refresh
        this.startSidebarListener();
    },

    // ============================================
    // SIDEBAR — ACTIVE AGENTS
    // ============================================

    loadSidebar: function() {
        var list = document.getElementById('agents-list');
        if (!list) return;

        DB_Storage.getUsers().then(function(users) {
            var agents = users.filter(function(u) { return u.role !== 'admin'; });

            if (agents.length === 0) {
                list.innerHTML =
                    '<div style="color:var(--text-dark); font-family:\'Share Tech Mono\',monospace; font-size:0.8rem; padding:0.5rem;">' +
                    'No agents registered.' +
                    '</div>';
                return;
            }

            Promise.all([
                DB_Storage.getQuestions(),
                DB_Storage.getResponses()
            ]).then(function(results) {
                var questions = results[0];
                var responses = results[1];

                list.innerHTML = agents.map(function(agent) {
                    var agentQuestions = questions.filter(function(q) {
                        return q.targetAgents.includes(agent.agentNumber) || q.targetAgents.includes('all');
                    });
                    var answeredCount = responses.filter(function(r) {
                        return r.agentNumber === agent.agentNumber;
                    }).length;
                    var total = agentQuestions.length;
                    var progress = total > 0
                        ? answeredCount + '/' + total + ' directives'
                        : 'No directives';
                    var isOnline = !!agent.lastLogin;

                    return '<div class="agent-item" data-agent="' + agent.agentNumber + '">' +
                        '<div class="agent-num">AGENT ' + DB_Utils.escapeHtml(agent.agentNumber) + '</div>' +
                        '<div class="agent-name">' + DB_Utils.escapeHtml(agent.nickname) + '</div>' +
                        '<div class="agent-status">' +
                            '<span style="color:' + (isOnline ? 'var(--accent)' : 'var(--text-dark)') + '">' +
                                (isOnline ? '● ONLINE' : '○ OFFLINE') +
                            '</span>' +
                            ' &nbsp; ' + progress +
                        '</div>' +
                    '</div>';
                }).join('');
            });
        });
    },

    startSidebarListener: function() {
        var self = this;
        // Listen for user or response changes and refresh sidebar
        DB_Ref.users().on('value', function() { self.loadSidebar(); });
        DB_Ref.responses().on('value', function() { self.loadSidebar(); });
    },

    // ============================================
    // TAB SWITCHING
    // ============================================

    switchTab: function(tabName) {
        // Deactivate all tabs and panels
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(function(panel) {
            panel.classList.remove('active');
        });

        // Activate selected
        var btn = document.querySelector('[data-tab="' + tabName + '"]');
        if (btn) btn.classList.add('active');

        var panel = document.getElementById('tab-' + tabName);
        if (panel) panel.classList.add('active');

        // Refresh data for the activated tab
        if (tabName === 'questions') {
            DB_Questions.loadSent();
        } else if (tabName === 'users') {
            DB_Users.loadTable();
        } else if (tabName === 'content') {
            DB_Content.updateSelects();
        } else if (tabName === 'responses') {
            DB_Responses.load();
        }
    },

    // ============================================
    // MENU TOGGLE
    // ============================================

    toggleMenu: function() {
        var menu = document.getElementById('admin-menu');
        if (menu) menu.classList.toggle('hidden');
    },

    // ============================================
    // BIND ALL ADMIN EVENT LISTENERS
    // ============================================

    bindEvents: function() {
        var self = this;

        // --- Admin nav menu toggle ---
        var btnAdminMenu = document.getElementById('btn-admin-menu');
        if (btnAdminMenu) {
            btnAdminMenu.addEventListener('click', function(e) {
                e.stopPropagation();
                self.toggleMenu();
            });
        }

        // --- Admin logout ---
        var btnAdminLogout = document.getElementById('btn-admin-logout');
        if (btnAdminLogout) {
            btnAdminLogout.addEventListener('click', function() {
                DB_Auth.logout();
            });
        }

        // --- Tab buttons ---
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                self.switchTab(btn.dataset.tab);
            });
        });

        // --- Question type toggle ---
        var qTypeSelect = document.getElementById('question-type-select');
        if (qTypeSelect) {
            qTypeSelect.addEventListener('change', function() {
                DB_Questions.toggleInput();
            });
        }

        // --- Media upload preview ---
        var mediaUpload = document.getElementById('media-upload');
        if (mediaUpload) {
            mediaUpload.addEventListener('change', function() {
                DB_Questions.handleMediaUpload();
            });
        }

        // --- Send question ---
        var btnSendQuestion = document.getElementById('btn-send-question');
        if (btnSendQuestion) {
            btnSendQuestion.addEventListener('click', function() {
                DB_Questions.send();
            });
        }

        // --- User management: Show add form ---
        var btnShowAddUser = document.getElementById('btn-show-add-user');
        if (btnShowAddUser) {
            btnShowAddUser.addEventListener('click', function() {
                DB_Users.showAddForm();
            });
        }

        // --- User management: Cancel add ---
        var btnCancelAddUser = document.getElementById('btn-cancel-add-user');
        if (btnCancelAddUser) {
            btnCancelAddUser.addEventListener('click', function() {
                DB_Users.hideAddForm();
            });
        }

        // --- User management: Register agent ---
        var btnAddUser = document.getElementById('btn-add-user');
        if (btnAddUser) {
            btnAddUser.addEventListener('click', function() {
                DB_Users.addNew();
            });
        }

        // --- Content: Update profile ---
        var btnUpdateProfile = document.getElementById('btn-update-profile');
        if (btnUpdateProfile) {
            btnUpdateProfile.addEventListener('click', function() {
                DB_Content.updateProfile();
            });
        }

        // --- Content: Assign grade ---
        var btnAssignGrade = document.getElementById('btn-assign-grade');
        if (btnAssignGrade) {
            btnAssignGrade.addEventListener('click', function() {
                DB_Content.assignGrade();
            });
        }

        // --- Content: Set level ---
        var btnSetLevel = document.getElementById('btn-set-level');
        if (btnSetLevel) {
            btnSetLevel.addEventListener('click', function() {
                DB_Content.setLevel();
            });
        }

        // --- Content: Award badge ---
        var btnAwardBadge = document.getElementById('btn-award-badge');
        if (btnAwardBadge) {
            btnAwardBadge.addEventListener('click', function() {
                DB_Content.awardBadge();
            });
        }

        // --- Close menus when clicking outside ---
        document.addEventListener('click', function(e) {
            var adminMenu = document.getElementById('admin-menu');
            var btnAdminMenuEl = document.getElementById('btn-admin-menu');
            if (adminMenu && btnAdminMenuEl &&
                !adminMenu.contains(e.target) &&
                !btnAdminMenuEl.contains(e.target)) {
                adminMenu.classList.add('hidden');
            }
        });
    },

    // ============================================
    // INIT
    // ============================================

    init: function() {
        this.bindEvents();
        DB_Content.init();
        DB_Responses.init();
    }
};

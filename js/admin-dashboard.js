/* ============================================
   DELTA BLACK — ADMIN DASHBOARD
   Fixed: startSidebarListener uses DB_Storage
   listeners instead of raw DB_Ref calls,
   preventing Firebase-not-ready errors
   ============================================ */

const DB_Admin = {

    // ============================================
    // SHOW DASHBOARD
    // ============================================

    showDashboard: function(user) {
        DB_Storage.setCurrentUser(user);
        DB_Utils.showScreen('admin-dashboard');

        DB_Utils.setText('admin-display-name', user.nickname || 'Delta Black');

        // Load all tab data
        this.loadSidebar();
        DB_Questions.loadSent();
        DB_Users.loadTable();
        DB_Content.updateSelects();
        DB_Responses.load();

        // Start real-time sidebar (Firebase is confirmed ready by this point)
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
                    '<div style="color:var(--text-dark);font-family:\'Share Tech Mono\',monospace;font-size:0.8rem;padding:0.5rem;">' +
                    'No agents registered.</div>';
                return;
            }

            Promise.all([
                DB_Storage.getQuestions(),
                DB_Storage.getResponses()
            ]).then(function(results) {
                var questions  = results[0];
                var responses  = results[1];

                list.innerHTML = agents.map(function(agent) {
                    var agentQs = questions.filter(function(q) {
                        return q.targetAgents.includes(agent.agentNumber) ||
                               q.targetAgents.includes('all');
                    });
                    var answered = responses.filter(function(r) {
                        return r.agentNumber === agent.agentNumber;
                    }).length;
                    var total    = agentQs.length;
                    var progress = total > 0
                        ? answered + '/' + total + ' directives'
                        : 'No directives';
                    var isOnline = !!agent.lastLogin;

                    return '<div class="agent-item" data-agent="' + agent.agentNumber + '">' +
                        '<div class="agent-num">AGENT ' + DB_Utils.escapeHtml(agent.agentNumber) + '</div>' +
                        '<div class="agent-name">' + DB_Utils.escapeHtml(agent.nickname) + '</div>' +
                        '<div class="agent-status">' +
                            '<span style="color:' + (isOnline ? 'var(--accent)' : 'var(--text-dark)') + '">' +
                                (isOnline ? '● ACTIVE' : '○ INACTIVE') +
                            '</span>' +
                            '&nbsp;&nbsp;' + progress +
                        '</div>' +
                    '</div>';
                }).join('');
            });
        });
    },

    // Uses DB_Storage listener — safe, Firebase-ready-gated
    startSidebarListener: function() {
        var self = this;
        DB_Storage.listenForUsers(function() {
            self.loadSidebar();
        });
        DB_Storage.listenForResponses(function() {
            self.loadSidebar();
        });
    },

    // ============================================
    // TAB SWITCHING
    // ============================================

    switchTab: function(tabName) {
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(function(panel) {
            panel.classList.remove('active');
        });

        var btn   = document.querySelector('[data-tab="' + tabName + '"]');
        var panel = document.getElementById('tab-' + tabName);
        if (btn)   btn.classList.add('active');
        if (panel) panel.classList.add('active');

        if      (tabName === 'questions') DB_Questions.loadSent();
        else if (tabName === 'users')     DB_Users.loadTable();
        else if (tabName === 'content')   DB_Content.updateSelects();
        else if (tabName === 'responses') DB_Responses.load();
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

        var btnAdminMenu = document.getElementById('btn-admin-menu');
        if (btnAdminMenu) {
            btnAdminMenu.addEventListener('click', function(e) {
                e.stopPropagation();
                self.toggleMenu();
            });
        }

        var btnAdminLogout = document.getElementById('btn-admin-logout');
        if (btnAdminLogout) {
            btnAdminLogout.addEventListener('click', function() {
                DB_Auth.logout();
            });
        }

        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                self.switchTab(btn.dataset.tab);
            });
        });

        var qTypeSelect = document.getElementById('question-type-select');
        if (qTypeSelect) {
            qTypeSelect.addEventListener('change', function() {
                DB_Questions.toggleInput();
            });
        }

        var mediaUpload = document.getElementById('media-upload');
        if (mediaUpload) {
            mediaUpload.addEventListener('change', function() {
                DB_Questions.handleMediaUpload();
            });
        }

        var btnSendQ = document.getElementById('btn-send-question');
        if (btnSendQ) {
            btnSendQ.addEventListener('click', function() {
                DB_Questions.send();
            });
        }

        var btnShowAdd = document.getElementById('btn-show-add-user');
        if (btnShowAdd) {
            btnShowAdd.addEventListener('click', function() {
                DB_Users.showAddForm();
            });
        }

        var btnCancelAdd = document.getElementById('btn-cancel-add-user');
        if (btnCancelAdd) {
            btnCancelAdd.addEventListener('click', function() {
                DB_Users.hideAddForm();
            });
        }

        var btnAddUser = document.getElementById('btn-add-user');
        if (btnAddUser) {
            btnAddUser.addEventListener('click', function() {
                DB_Users.addNew();
            });
        }

        var btnUpdateProfile = document.getElementById('btn-update-profile');
        if (btnUpdateProfile) {
            btnUpdateProfile.addEventListener('click', function() {
                DB_Content.updateProfile();
            });
        }

        var btnAssignGrade = document.getElementById('btn-assign-grade');
        if (btnAssignGrade) {
            btnAssignGrade.addEventListener('click', function() {
                DB_Content.assignGrade();
            });
        }

        var btnSetLevel = document.getElementById('btn-set-level');
        if (btnSetLevel) {
            btnSetLevel.addEventListener('click', function() {
                DB_Content.setLevel();
            });
        }

        var btnAwardBadge = document.getElementById('btn-award-badge');
        if (btnAwardBadge) {
            btnAwardBadge.addEventListener('click', function() {
                DB_Content.awardBadge();
            });
        }
    },

    // ============================================
    // INIT — called once on page load
    // ============================================

    init: function() {
        this.bindEvents();
        DB_Content.init();
        DB_Responses.init();
    }
};

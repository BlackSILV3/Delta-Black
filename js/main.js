(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        console.log('Delta Black System Initializing...');
        
        DB_Auth.init();
        DB_Welcome.init();
        DB_Content.init();
        wireAllEventListeners();
        checkForExistingSession();
        
        console.log('System Ready.');
    });

    function checkForExistingSession() {
        var session = DB_Auth.checkExistingSession();
        if (session) {
            console.log('Existing session found:', session.role);
            if (session.role === 'admin') {
                DB_Admin.showDashboard(session.user);
            } else {
                DB_User.showDashboard(session.user);
            }
        }
    }

    function wireAllEventListeners() {
        
        // Welcome Screen
        var btnEnter = document.getElementById('btn-enter');
        if (btnEnter) {
            btnEnter.addEventListener('click', function(e) {
                e.preventDefault();
                DB_Welcome.enterSystem();
            });
        }
        
        // Login Screen
        var btnAuth = document.getElementById('btn-auth');
        if (btnAuth) {
            btnAuth.addEventListener('click', function(e) {
                e.preventDefault();
                DB_Login.handleLogin();
            });
        }
        
        // Enter key on login fields
        ['agent-number', 'barcode', 'nickname'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') DB_Login.handleLogin();
                });
            }
        });
        
        // User Dashboard
        DB_Utils.onClick('btn-user-menu', function() { DB_User.toggleMenu(); });
        DB_Utils.onClick('btn-user-logout', function() { DB_Auth.logout(); });
        
        var btnSubmitAnswer = document.getElementById('btn-submit-answer');
        if (btnSubmitAnswer) {
            btnSubmitAnswer.addEventListener('click', function(e) {
                e.preventDefault();
                DB_User.submitAnswer();
            });
        }
        
        // Admin Dashboard
        DB_Utils.onClick('btn-admin-menu', function() { DB_Admin.toggleMenu(); });
        DB_Utils.onClick('btn-admin-logout', function() { DB_Auth.logout(); });
        
        // Admin Tabs
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var tabName = this.dataset.tab;
                DB_Admin.switchTab(tabName);
            });
        });
        
        // Questions Tab
        var questionTypeSelect = document.getElementById('question-type-select');
        if (questionTypeSelect) {
            questionTypeSelect.addEventListener('change', function() {
                DB_Questions.toggleInput();
            });
        }
        
        var btnSendQuestion = document.getElementById('btn-send-question');
        if (btnSendQuestion) {
            btnSendQuestion.addEventListener('click', function(e) {
                e.preventDefault();
                DB_Questions.send();
            });
        }
        
        var mediaUpload = document.getElementById('media-upload');
        if (mediaUpload) {
            mediaUpload.addEventListener('change', function() {
                DB_Questions.handleMediaUpload();
            });
        }
        
        // Users Tab
        DB_Utils.onClick('btn-show-add-user', function() { DB_Users.showAddForm(); });
        
        var btnAddUser = document.getElementById('btn-add-user');
        if (btnAddUser) {
            btnAddUser.addEventListener('click', function(e) {
                e.preventDefault();
                DB_Users.addNew();
            });
        }
        
        DB_Utils.onClick('btn-cancel-add-user', function() { DB_Users.hideAddForm(); });
        
        // Content Tab
        var btnUpdateProfile = document.getElementById('btn-update-profile');
        if (btnUpdateProfile) {
            btnUpdateProfile.addEventListener('click', function(e) {
                e.preventDefault();
                DB_Content.updateProfile();
            });
        }
        
        var btnAssignGrade = document.getElementById('btn-assign-grade');
        if (btnAssignGrade) {
            btnAssignGrade.addEventListener('click', function(e) {
                e.preventDefault();
                DB_Content.assignGrade();
            });
        }
        
        var btnSetLevel = document.getElementById('btn-set-level');
        if (btnSetLevel) {
            btnSetLevel.addEventListener('click', function(e) {
                e.preventDefault();
                DB_Content.setLevel();
            });
        }
        
        var btnAwardBadge = document.getElementById('btn-award-badge');
        if (btnAwardBadge) {
            btnAwardBadge.addEventListener('click', function(e) {
                e.preventDefault();
                DB_Content.awardBadge();
            });
        }
        
        // Responses Tab
        var responseFilter = document.getElementById('response-filter');
        if (responseFilter) {
            responseFilter.addEventListener('change', function() {
                DB_Responses.load();
            });
        }
        
        // Data Management Tab
        var btnExportData = document.getElementById('btn-export-data');
        if (btnExportData) {
            btnExportData.addEventListener('click', function(e) {
                e.preventDefault();
                DB_Admin.exportData();
            });
        }
        
        var btnImportData = document.getElementById('btn-import-data');
        if (btnImportData) {
            btnImportData.addEventListener('click', function(e) {
                e.preventDefault();
                DB_Admin.importData();
            });
        }
        
        var btnResetSystem = document.getElementById('btn-reset-system');
        if (btnResetSystem) {
            btnResetSystem.addEventListener('click', function(e) {
                e.preventDefault();
                DB_Admin.resetSystem();
            });
        }
        
        // Global: Click outside to close menus
        document.addEventListener('click', function(e) {
            var userMenu = document.getElementById('user-menu');
            var adminMenu = document.getElementById('admin-menu');
            var userMenuBtn = document.getElementById('btn-user-menu');
            var adminMenuBtn = document.getElementById('btn-admin-menu');
            
            if (userMenu && !userMenu.contains(e.target) && e.target !== userMenuBtn) {
                userMenu.classList.add('hidden');
            }
            
            if (adminMenu && !adminMenu.contains(e.target) && e.target !== adminMenuBtn) {
                adminMenu.classList.add('hidden');
            }
        });
    }

    var shakeStyle = document.createElement('style');
    shakeStyle.textContent = '@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }';
    document.head.appendChild(shakeStyle);

})();

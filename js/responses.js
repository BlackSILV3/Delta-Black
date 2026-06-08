/* ============================================
   DELTA BLACK — RESPONSES MODULE
   Loads and displays agent responses in the admin panel
   ============================================ */

const DB_Responses = {

    // ============================================
    // LOAD & DISPLAY
    // ============================================

    load: function() {
        var filterEl = document.getElementById('response-filter');
        var filterValue = filterEl ? filterEl.value : 'all';
        var list = document.getElementById('responses-list');

        if (!list) return;

        list.innerHTML = '<div class="loading-responses"><div class="spinner"></div><p>Loading responses...</p></div>';

        Promise.all([
            DB_Storage.getResponses(),
            DB_Storage.getQuestions(),
            DB_Storage.getUsers()
        ]).then(function(results) {
            var responses = results[0];
            var questions = results[1];
            var users = results[2];

            // Filter by agent if needed
            if (filterValue && filterValue !== 'all') {
                responses = responses.filter(function(r) {
                    return r.agentNumber === filterValue;
                });
            }

            if (responses.length === 0) {
                list.innerHTML =
                    '<div class="empty-state">' +
                        '<p>No responses recorded yet.</p>' +
                        '<span>Agents have not submitted any answers.</span>' +
                    '</div>';
                return;
            }

            // Sort newest first
            responses.sort(function(a, b) {
                return new Date(b.submittedAt) - new Date(a.submittedAt);
            });

            // Build question lookup map
            var questionMap = {};
            questions.forEach(function(q) { questionMap[q.id] = q; });

            // Build user lookup map
            var userMap = {};
            users.forEach(function(u) { userMap[u.agentNumber] = u; });

            list.innerHTML = responses.map(function(r) {
                var question = questionMap[r.questionId];
                var user = userMap[r.agentNumber];
                var agentLabel = user
                    ? 'Agent ' + user.agentNumber + ' — ' + user.nickname
                    : 'Agent ' + r.agentNumber;

                var questionPreview = '';
                if (question) {
                    if (question.type === 'text') {
                        questionPreview = DB_Utils.escapeHtml(question.content.substring(0, 120)) +
                            (question.content.length > 120 ? '...' : '');
                    } else {
                        questionPreview = '[' + question.type.toUpperCase() + ' DIRECTIVE]';
                    }
                } else {
                    questionPreview = '[Directive no longer available]';
                }

                return '<div class="response-item">' +
                    '<div class="response-header">' +
                        '<span class="response-meta response-agent">' + DB_Utils.escapeHtml(agentLabel) + '</span>' +
                        '<span class="response-meta">' + DB_Utils.formatDate(r.submittedAt) + '</span>' +
                    '</div>' +
                    '<div class="response-question">' +
                        '<span class="response-label">DIRECTIVE:</span> ' +
                        '<span class="response-q-text">' + questionPreview + '</span>' +
                    '</div>' +
                    '<div class="response-body">' +
                        '<span class="response-label">RESPONSE:</span><br>' +
                        DB_Utils.escapeHtml(r.answer) +
                    '</div>' +
                    '<div class="response-footer">' +
                        '<span class="response-status status-submitted">● SUBMITTED</span>' +
                    '</div>' +
                '</div>';
            }).join('');
        }).catch(function(err) {
            list.innerHTML = '<div class="empty-state"><p>Error loading responses.</p></div>';
            console.error('Responses load error:', err);
        });
    },

    // ============================================
    // REAL-TIME LISTENER
    // ============================================

    startListener: function() {
        var self = this;
        DB_Storage.listenForResponses(function(responses) {
            // Only reload if the responses tab is active
            var tab = document.getElementById('tab-responses');
            if (tab && tab.classList.contains('active')) {
                self.load();
            }
        });
    },

    // ============================================
    // INIT
    // ============================================

    init: function() {
        var self = this;

        // Filter change handler
        var filterEl = document.getElementById('response-filter');
        if (filterEl) {
            filterEl.addEventListener('change', function() {
                self.load();
            });
        }

        // Listen for user updates to refresh filter dropdown
        document.addEventListener('usersUpdated', function() {
            self.load();
        });

        // Start real-time listener
        this.startListener();
    }
};

/* ============================================
   EXTRA STYLES for responses
   ============================================ */
(function() {
    var style = document.createElement('style');
    style.textContent = [
        '.response-label {',
        '  font-family: "Share Tech Mono", monospace;',
        '  font-size: 0.72rem;',
        '  color: var(--text-dark);',
        '  text-transform: uppercase;',
        '  letter-spacing: 0.1em;',
        '}',
        '.response-q-text {',
        '  font-size: 0.9rem;',
        '  color: var(--text-dim);',
        '  font-style: italic;',
        '}',
        '.response-question {',
        '  margin-bottom: 0.75rem;',
        '  padding: 0.5rem 0.75rem;',
        '  background: var(--secondary);',
        '  border-left: 2px solid var(--border);',
        '}',
        '.response-agent {',
        '  color: var(--info) !important;',
        '  font-weight: 600;',
        '}',
        '.response-footer {',
        '  margin-top: 0.75rem;',
        '  padding-top: 0.5rem;',
        '  border-top: 1px solid var(--border);',
        '}',
        '.status-submitted {',
        '  font-family: "Share Tech Mono", monospace;',
        '  font-size: 0.72rem;',
        '  color: var(--accent);',
        '}',
        '.loading-responses {',
        '  display: flex;',
        '  flex-direction: column;',
        '  align-items: center;',
        '  gap: 1rem;',
        '  padding: 2rem;',
        '  color: var(--text-dim);',
        '  font-family: "Share Tech Mono", monospace;',
        '  font-size: 0.85rem;',
        '}',
        '.empty-state {',
        '  text-align: center;',
        '  padding: 3rem;',
        '  color: var(--text-dark);',
        '}',
        '.empty-state p {',
        '  font-family: "Orbitron", sans-serif;',
        '  font-size: 0.9rem;',
        '  margin-bottom: 0.5rem;',
        '}',
        '.empty-state span {',
        '  font-family: "Share Tech Mono", monospace;',
        '  font-size: 0.8rem;',
        '}'
    ].join('\n');
    document.head.appendChild(style);
})();

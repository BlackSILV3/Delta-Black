const DB_Responses = {
    load: function() {
        var filterEl = document.getElementById('response-filter');
        var filter = filterEl ? filterEl.value : 'all';
        var responses = DB_Storage.getResponses();
        var questions = DB_Storage.getQuestions();
        var users = DB_Storage.getUsers();
        
        var filteredResponses = filter === 'all' 
            ? responses 
            : responses.filter(function(r) { return r.agentNumber === filter; });
        
        var list = document.getElementById('responses-list');
        if (!list) return;
        
        if (filteredResponses.length === 0) {
            list.innerHTML = '<p style="color:var(--text-dark); font-style:italic;">No responses received.</p>';
            return;
        }
        
        var reversed = filteredResponses.slice().reverse();
        list.innerHTML = reversed.map(function(r) {
            var question = questions.find(function(q) { return q.id === r.questionId; });
            var user = users.find(function(u) { return u.agentNumber === r.agentNumber; });
            
            var qPreview = question 
                ? (question.type === 'text' ? DB_Utils.escapeHtml(question.content.substring(0, 100)) : '[' + question.type.toUpperCase() + ']')
                : 'Unknown';
            
            return '<div class="response-item">' +
                '<div class="response-header">' +
                    '<span class="response-meta">' +
                        'Agent ' + r.agentNumber + ' ' + (user ? '— ' + user.nickname : '') +
                    '</span>' +
                    '<span class="response-meta">' + DB_Utils.formatDate(r.submittedAt) + '</span>' +
                '</div>' +
                '<div class="question-body" style="margin-bottom:0.5rem; padding:0.5rem; background:var(--secondary);">' +
                    '<small style="color:var(--text-dim);">Q: ' + qPreview + '</small>' +
                '</div>' +
                '<div class="response-body">' +
                    '<strong style="color:var(--accent);">A:</strong> ' + DB_Utils.escapeHtml(r.answer) +
                '</div>' +
            '</div>';
        }).join('');
    }
};

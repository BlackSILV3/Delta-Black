const DB_User = {
    showDashboard: function(user) {
        DB_Utils.showScreen('user-dashboard');
        
        var welcomeMsg = DB_Storage.getWelcomeMessage();
        DB_Utils.setText('welcome-message', welcomeMsg);
        DB_Utils.setText('welcome-subtitle', 'Agent ' + user.agentNumber + ' — ' + user.nickname);
        DB_Utils.setText('user-display-name', user.nickname);
        
        this.loadQuestions(user);
        this.updateMenu(user);
    },

    loadQuestions: function(user) {
        var questions = DB_Storage.getQuestionsForAgent(user.agentNumber);
        var answeredIds = DB_Storage.getAnsweredQuestionIds(user.agentNumber);
        var pendingQuestions = questions.filter(function(q) { return !answeredIds.includes(q.id); });
        
        var answerSection = document.getElementById('answer-section');
        var waitingMsg = document.getElementById('waiting-message');
        
        if (pendingQuestions.length === 0) {
            if (questions.length > 0 && answeredIds.length >= questions.length) {
                DB_Utils.setHtml('question-content', '<p class="no-questions">All directives completed. Awaiting further orders.</p>');
            } else {
                DB_Utils.setHtml('question-content', '<p class="no-questions">No active directives at this time. Stand by.</p>');
            }
            DB_Utils.setText('question-counter', 'Question 0 of 0');
            DB_Utils.setText('question-type', 'STANDBY');
            DB_Utils.addClass('answer-section', 'hidden');
            DB_Utils.removeClass('waiting-message', 'active');
            return;
        }
        
        var currentQ = pendingQuestions[0];
        var qIndex = questions.indexOf(currentQ) + 1;
        
        DB_Utils.setText('question-counter', 'Question ' + qIndex + ' of ' + questions.length);
        DB_Utils.setText('question-type', currentQ.type.toUpperCase());
        
        var contentHTML = '';
        if (currentQ.type === 'text') {
            contentHTML = '<p>' + DB_Utils.escapeHtml(currentQ.content) + '</p>';
        } else if (currentQ.type === 'image') {
            contentHTML = '<img src="' + currentQ.content + '" alt="Question Image" style="max-width:100%;">';
        } else if (currentQ.type === 'video') {
            contentHTML = '<video controls src="' + currentQ.content + '" style="max-width:100%;"></video>';
        } else if (currentQ.type === 'audio') {
            contentHTML = '<audio controls src="' + currentQ.content + '" style="width:100%;"></audio>';
        }
        
        DB_Utils.setHtml('question-content', contentHTML);
        
        DB_Utils.removeClass('answer-section', 'hidden');
        DB_Utils.removeClass('waiting-message', 'active');
        
        if (answerSection) {
            answerSection.dataset.currentQuestionId = currentQ.id;
        }
        DB_Utils.clearValue('user-answer');
    },

    submitAnswer: function() {
        var answerText = DB_Utils.getValue('user-answer');
        var answerSection = document.getElementById('answer-section');
        var questionId = answerSection ? answerSection.dataset.currentQuestionId : null;
        var user = DB_Storage.getCurrentUser();
        
        if (!answerText) {
            alert('Response cannot be empty, Agent.');
            return;
        }
        
        if (!user || !questionId) return;
        
        DB_Storage.addResponse({
            id: DB_Utils.generateId(),
            questionId: questionId,
            agentNumber: user.agentNumber,
            answer: answerText,
            submittedAt: new Date().toISOString(),
            status: 'submitted'
        });
        
        DB_Utils.addClass('answer-section', 'hidden');
        DB_Utils.addClass('waiting-message', 'active');
        
        var self = this;
        setTimeout(function() {
            self.loadQuestions(user);
        }, 1500);
    },

    toggleMenu: function() {
        var menu = document.getElementById('user-menu');
        if (menu) menu.classList.toggle('hidden');
    },

    updateMenu: function(user) {
        DB_Utils.setText('menu-user-name', user.nickname);
        DB_Utils.setText('menu-agent-number', 'Agent ' + user.agentNumber);
        
        DB_Utils.setHtml('menu-profile', user.profile || 'No profile data available.');
        
        var gradesHTML = user.grades && user.grades.length > 0 
            ? user.grades.map(function(g) { return '<div class="badge-item">📊 ' + g.value + ' <small>' + g.date + '</small></div>'; }).join('')
            : 'No grades assigned.';
        DB_Utils.setHtml('menu-grades', gradesHTML);
        
        var levelsHTML = user.levels && user.levels.length > 0
            ? user.levels.map(function(l) { return '<div class="badge-item">⬆️ ' + l.value + ' <small>' + l.date + '</small></div>'; }).join('')
            : 'No levels assigned.';
        DB_Utils.setHtml('menu-levels', levelsHTML);
        
        var badgesHTML = user.badges && user.badges.length > 0
            ? user.badges.map(function(b) { return '<div class="badge-item">' + (b.icon || '🏅') + ' ' + b.name + '</div>'; }).join('')
            : 'No badges awarded.';
        DB_Utils.setHtml('menu-badges', badgesHTML);
    }
};

const DB_Questions = {
    uploadedMediaData: null,
    uploadedMediaFile: null,

    toggleInput: function() {
        var type = document.getElementById('question-type-select');
        var textGroup = document.getElementById('text-input-group');
        var fileGroup = document.getElementById('file-input-group');
        
        if (!type || !textGroup || !fileGroup) return;
        
        if (type.value === 'text') {
            DB_Utils.removeClass('text-input-group', 'hidden');
            DB_Utils.addClass('file-input-group', 'hidden');
        } else {
            DB_Utils.addClass('text-input-group', 'hidden');
            DB_Utils.removeClass('file-input-group', 'hidden');
        }
    },

    handleMediaUpload: function() {
        var fileInput = document.getElementById('media-upload');
        var preview = document.getElementById('media-preview');
        var file = fileInput ? fileInput.files[0] : null;
        
        if (!file || !preview) return;
        
        this.uploadedMediaFile = file;
        
        var self = this;
        var reader = new FileReader();
        reader.onload = function(e) {
            self.uploadedMediaData = e.target.result;
            
            if (file.type.startsWith('image/')) {
                preview.innerHTML = '<img src="' + e.target.result + '" alt="Preview" style="max-width:100%; max-height:200px;">';
            } else if (file.type.startsWith('video/')) {
                preview.innerHTML = '<video controls src="' + e.target.result + '" style="max-width:100%; max-height:200px;"></video>';
            } else if (file.type.startsWith('audio/')) {
                preview.innerHTML = '<audio controls src="' + e.target.result + '" style="width:100%;"></audio>';
            }
        };
        reader.readAsDataURL(file);
    },

    send: function() {
        var targetSelect = document.getElementById('target-agent');
        var selectedOptions = targetSelect ? Array.from(targetSelect.selectedOptions).map(function(o) { return o.value; }) : [];
        var type = document.getElementById('question-type-select');
        var deliveryMode = document.getElementById('delivery-mode');
        var textContent = DB_Utils.getValue('admin-question-text');
        
        var content = '';
        var self = this;
        
        if (type && type.value === 'text') {
            content = textContent;
            if (!content) {
                alert('Enter question text.');
                return;
            }
            this.saveQuestion(content, type.value, selectedOptions, deliveryMode);
        } else {
            // Upload media to Firebase Storage first
            if (!this.uploadedMediaFile) {
                alert('Upload media file first.');
                return;
            }
            
            var path = 'questions/' + DB_Utils.generateId() + '_' + this.uploadedMediaFile.name;
            DB_Storage.uploadMedia(this.uploadedMediaFile, path).then(function(url) {
                self.saveQuestion(url, type.value, selectedOptions, deliveryMode);
            }).catch(function(err) {
                alert('Upload failed: ' + err.message);
            });
        }
    },

    saveQuestion: function(content, type, selectedOptions, deliveryMode) {
        var targetAgents = selectedOptions.includes('all') || selectedOptions.length === 0 ? ['all'] : selectedOptions;
        
        var question = {
            id: DB_Utils.generateId(),
            type: type,
            content: content,
            targetAgents: targetAgents,
            deliveryMode: deliveryMode ? deliveryMode.value : 'sequential',
            sentBy: 'Delta Black',
            sentAt: new Date().toISOString(),
            status: 'active'
        };
        
        DB_Storage.addQuestion(question).then(function() {
            DB_Utils.clearValue('admin-question-text');
            var fileInput = document.getElementById('media-upload');
            if (fileInput) fileInput.value = '';
            var preview = document.getElementById('media-preview');
            if (preview) preview.innerHTML = '';
            DB_Questions.uploadedMediaData = null;
            DB_Questions.uploadedMediaFile = null;
            
            DB_Questions.loadSent();
            alert('Directive transmitted to ' + targetAgents.join(', ') + ' successfully.');
        });
    },

    loadSent: function() {
        DB_Storage.getQuestions().then(function(questions) {
            var list = document.getElementById('sent-questions-list');
            
            if (!list) return;
            
            if (questions.length === 0) {
                list.innerHTML = '<p style="color:var(--text-dark); font-style:italic;">No directives sent yet.</p>';
                return;
            }
            
            var reversed = questions.slice().reverse();
            list.innerHTML = reversed.map(function(q) {
                return '<div class="question-item admin-item">' +
                    '<div class="question-header">' +
                        '<span class="question-meta">' + q.type.toUpperCase() + ' → ' + (q.targetAgents.includes('all') ? 'ALL AGENTS' : q.targetAgents.join(', ')) + '</span>' +
                        '<span class="question-meta">' + DB_Utils.formatDate(q.sentAt) + '</span>' +
                    '</div>' +
                    '<div class="question-body">' +
                        (q.type === 'text' ? DB_Utils.escapeHtml(q.content) : '[' + q.type.toUpperCase() + ' ATTACHED]') +
                    '</div>' +
                '</div>';
            }).join('');
        });
    }
};

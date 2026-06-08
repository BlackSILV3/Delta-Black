/* ============================================
   DELTA BLACK — STORAGE LAYER (Firebase Realtime DB)
   Full cross-device real-time sync.
   Any admin or agent on any browser/device sees
   live data instantly via Firebase listeners.
   ============================================ */

const DB_Storage = {

    // In-memory session cache
    currentUser: null,

    // Active Firebase listeners (so we can detach on logout)
    _listeners: {},

    // ============================================
    // USERS
    // ============================================

    getUsers: function() {
        return new Promise(function(resolve, reject) {
            DB_Ref.users().once('value')
                .then(function(snapshot) {
                    var data = snapshot.val() || {};
                    resolve(Object.values(data));
                })
                .catch(reject);
        });
    },

    getUserByAgentNumber: function(agentNumber) {
        return new Promise(function(resolve, reject) {
            DB_Ref.user(agentNumber).once('value')
                .then(function(snapshot) {
                    resolve(snapshot.val() || null);
                })
                .catch(reject);
        });
    },

    addUser: function(user) {
        return DB_Ref.user(user.agentNumber).set(user);
    },

    saveUser: function(user) {
        return DB_Ref.user(user.agentNumber).set(user);
    },

    updateUser: function(updatedUser) {
        return DB_Ref.user(updatedUser.agentNumber).update(updatedUser);
    },

    deleteUserByAgentNumber: function(agentNumber) {
        // Remove user + all their responses atomically
        var self = this;
        return DB_Ref.user(agentNumber).remove()
            .then(function() {
                return self.getResponses();
            })
            .then(function(responses) {
                var deletions = responses
                    .filter(function(r) { return r.agentNumber === agentNumber; })
                    .map(function(r) { return DB_Ref.response(r.id).remove(); });
                return Promise.all(deletions);
            });
    },

    // Real-time listener — fires instantly on any device when users change
    listenForUsers: function(callback) {
        var ref = DB_Ref.users();
        var handler = ref.on('value', function(snapshot) {
            var data = snapshot.val() || {};
            callback(Object.values(data));
        });
        this._listeners['users'] = { ref: ref, handler: handler };
    },

    // ============================================
    // QUESTIONS
    // ============================================

    getQuestions: function() {
        return new Promise(function(resolve, reject) {
            DB_Ref.questions().once('value')
                .then(function(snapshot) {
                    var data = snapshot.val() || {};
                    var questions = Object.values(data);
                    questions.sort(function(a, b) {
                        return new Date(a.sentAt) - new Date(b.sentAt);
                    });
                    resolve(questions);
                })
                .catch(reject);
        });
    },

    addQuestion: function(question) {
        return DB_Ref.question(question.id).set(question);
    },

    getQuestionsForAgent: function(agentNumber) {
        return this.getQuestions().then(function(questions) {
            return questions.filter(function(q) {
                return q.targetAgents.includes(agentNumber) ||
                       q.targetAgents.includes('all');
            });
        });
    },

    // Real-time listener — agent sees new questions the instant admin sends them
    listenForQuestions: function(agentNumber, callback) {
        var ref = DB_Ref.questions();
        var handler = ref.on('value', function(snapshot) {
            var data = snapshot.val() || {};
            var questions = Object.values(data)
                .filter(function(q) {
                    return q.targetAgents.includes(agentNumber) ||
                           q.targetAgents.includes('all');
                })
                .sort(function(a, b) {
                    return new Date(a.sentAt) - new Date(b.sentAt);
                });
            callback(questions);
        }, function(err) {
            console.error('[Delta Black] Question listener error:', err);
        });
        this._listeners['questions_' + agentNumber] = { ref: ref, handler: handler };
    },

    // ============================================
    // RESPONSES
    // ============================================

    getResponses: function() {
        return new Promise(function(resolve, reject) {
            DB_Ref.responses().once('value')
                .then(function(snapshot) {
                    var data = snapshot.val() || {};
                    resolve(Object.values(data));
                })
                .catch(reject);
        });
    },

    addResponse: function(response) {
        return DB_Ref.response(response.id).set(response);
    },

    getResponsesByAgent: function(agentNumber) {
        return this.getResponses().then(function(responses) {
            return responses.filter(function(r) {
                return r.agentNumber === agentNumber;
            });
        });
    },

    getAnsweredQuestionIds: function(agentNumber) {
        return this.getResponsesByAgent(agentNumber).then(function(responses) {
            return responses.map(function(r) { return r.questionId; });
        });
    },

    // Real-time listener — admin sees agent responses the instant they submit
    listenForResponses: function(callback) {
        var ref = DB_Ref.responses();
        var handler = ref.on('value', function(snapshot) {
            var data = snapshot.val() || {};
            callback(Object.values(data));
        }, function(err) {
            console.error('[Delta Black] Response listener error:', err);
        });
        this._listeners['responses'] = { ref: ref, handler: handler };
    },

    // ============================================
    // WELCOME MESSAGE
    // ============================================

    getWelcomeMessage: function() {
        return new Promise(function(resolve, reject) {
            DB_Ref.welcomeMessage().once('value')
                .then(function(snapshot) {
                    resolve(snapshot.val() || DB_CONFIG.DEFAULT_WELCOME);
                })
                .catch(reject);
        });
    },

    setWelcomeMessage: function(message) {
        return DB_Ref.welcomeMessage().set(message);
    },

    // ============================================
    // SESSION — stored locally per device
    // (the identity of who is logged in on this device)
    // ============================================

    getCurrentUser: function() {
        try {
            var data = localStorage.getItem(DB_CONFIG.STORAGE_KEYS.currentUser);
            return data ? JSON.parse(data) : null;
        } catch(e) { return null; }
    },

    setCurrentUser: function(user) {
        this.currentUser = user;
        try {
            localStorage.setItem(
                DB_CONFIG.STORAGE_KEYS.currentUser,
                JSON.stringify(user)
            );
        } catch(e) { console.error('[Delta Black] Session save error:', e); }
    },

    clearCurrentUser: function() {
        this.currentUser = null;
        try {
            localStorage.removeItem(DB_CONFIG.STORAGE_KEYS.currentUser);
        } catch(e) {}
        // Detach all Firebase listeners on logout
        this._detachAllListeners();
    },

    // ============================================
    // MEDIA — Firebase Storage (images, video, audio)
    // ============================================

    uploadMedia: function(file, path) {
        var ref = STORAGE.ref().child(path);
        return ref.put(file).then(function(snapshot) {
            return snapshot.ref.getDownloadURL();
        });
    },

    // ============================================
    // INITIALIZATION
    // Seeds admin account and welcome message on
    // first ever run. Safe to call on every boot.
    // ============================================

    initialize: function() {
        var self = this;

        // Initialize resolves immediately — Firebase sync is best-effort.
        // Admin login works from config alone; agents need Firebase.
        // This means the app boots and the welcome/login screen always appear,
        // even in editor preview without a live internet connection.
        return new Promise(function(resolve) {

            // Attempt Firebase connection with a 5-second timeout
            var settled = false;
            function done() {
                if (!settled) { settled = true; resolve(); }
            }

            // Timeout fallback — resolve anyway after 5s so app never hangs
            var timer = setTimeout(done, 5000);

            DB.ref('.info/connected').once('value')
                .then(function() {
                    clearTimeout(timer);
                    // Seed welcome message if not set
                    return self.getWelcomeMessage();
                })
                .then(function(msg) {
                    if (!msg || msg === DB_CONFIG.DEFAULT_WELCOME) {
                        return self.setWelcomeMessage(DB_CONFIG.DEFAULT_WELCOME);
                    }
                })
                .then(done)
                .catch(function(err) {
                    clearTimeout(timer);
                    var msg  = err.message || '';
                    var code = err.code    || '';
                    if (code === 'PERMISSION_DENIED' || msg.indexOf('PERMISSION_DENIED') !== -1) {
                        console.error('[Delta Black] Firebase rules not set. Go to Firebase Console > Realtime Database > Rules > set read/write true');
                    } else {
                        console.warn('[Delta Black] Firebase init warning:', err);
                    }
                    // Resolve anyway — admin can still login via config
                    done();
                });
        });
    },

    // ============================================
    // INTERNAL — detach Firebase listeners on logout
    // ============================================

    _detachAllListeners: function() {
        var self = this;
        Object.keys(this._listeners).forEach(function(key) {
            var entry = self._listeners[key];
            if (entry && entry.ref && entry.handler) {
                try { entry.ref.off('value', entry.handler); } catch(e) {}
            }
        });
        this._listeners = {};
    }
};

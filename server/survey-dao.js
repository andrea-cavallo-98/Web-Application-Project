'use strict';

const sqlite = require('sqlite3');
const db = require('./db');

// Check if string is empty or contains only white spaces
String.prototype.isEmpty = function () {
    return (this.length === 0 || !this.trim());
};

/* Data Access Object (DAO) module for accessing survey information */

// get all surveys
exports.getAllSurveys = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM SURVEYS';
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            const surveys = rows.map((s) => ({ id: s.s_id, title: s.title, admin_id: s.admin_id }));
            resolve(surveys);
        });
    });
};



// get all surveys for an admin
exports.getAllSurveysAdmin = (id) => {
    return new Promise((resolve, reject) => {
        let sql = 'SELECT SURVEYS.s_id, SURVEYS.title, SURVEYS.admin_id, COUNT(DISTINCT ANSWERS.user_id) as responses ' +
            'FROM SURVEYS LEFT JOIN ANSWERS ON SURVEYS.s_id = ANSWERS.survey_id  WHERE SURVEYS.admin_id = ? GROUP BY SURVEYS.s_id';
        db.all(sql, [id], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            let surveys = rows.map((s) => ({ id: s.s_id, title: s.title, admin_id: s.admin_id, responses: s.responses }));
            resolve(surveys);
        });
    });
};


// get questions for a specific survey
exports.getQuestions = (s_id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM QUESTIONS WHERE survey_id = ?';
        db.all(sql, [s_id], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            if (rows == undefined) {
                reject({ error: 'Survey not found.' });
            } else {
                const questions = rows.map((q) => ({
                    id: q.q_id, text: q.question_text, possible_answers: q.possible_answers,
                    s_id: q.survey_id, min_ans: q.min_ans, max_ans: q.max_ans
                }));
                resolve(questions);
            }
        });
    });
};

// create a new survey
exports.createSurvey = (title, admin_id) => {

    return new Promise((resolve, reject) => {

        /* Check that title is not empty */
        let dataCorrect = true;
        if (title.isEmpty())
            dataCorrect = false;

        if (!dataCorrect) {
            reject({ error: "Data is not correct!" });
            return;
        }

        /* Insert data into db */
        let sql = 'INSERT INTO SURVEYS(s_id, title, admin_id) VALUES(null, ?, ?)';

        db.run(sql, [title, admin_id], function (err) {
            if (err) {
                reject(err);
                return;
            }
            // return survey id
            resolve(this.lastID);
        });
    });
};

// add a question for a specific survey
exports.addQuestionForSurvey = (t, answers, s_id, min_ans, max_ans) => {

    return new Promise((resolve, reject) => {

        let dataCorrect = true;

        // Check text of question is not empty
        if (t.isEmpty())
            dataCorrect = false;

        // Check min and max ans
        if (min_ans > max_ans || max_ans === 0) 
            dataCorrect = false;

        if (!dataCorrect) {
            reject({ error: "Data is not correct!" });
            return;
        }

        let sql = 'INSERT INTO QUESTIONS(q_id, question_text, possible_answers, survey_id, min_ans, max_ans) VALUES(null, ?, ?, ?, ?, ?)';
        db.run(sql, [t, answers, s_id, min_ans, max_ans], function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.lastID);
        });
    });
};

// add single user answer to a survey
exports.storeSingleAnswer = (user, a, survey_id, question_id, user_id) => {
    return new Promise((resolve, reject) => {

        /*** Validation of data to insert into db ***/
        let dataCorrect = true;

        if (user.isEmpty())
            dataCorrect = false;

        if (!dataCorrect) {
            reject({ error: "Data is not correct!" });
            return;
        }

        /* Insert data into db */
        let sql = 'INSERT INTO ANSWERS(id, username, answer, survey_id, question_id, user_id) VALUES(null, ?, ?, ?, ?, ?)';
        db.run(sql, [user, a, survey_id, question_id, user_id], function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.lastID);
        });
    });
};

// get next user id to insert answers to a survey
exports.getNextUserId = (survey_id) => {
    return new Promise((resolve, reject) => {

        let sql = "SELECT MAX(user_id)+1 as next_id FROM ANSWERS WHERE survey_id=?";
        let user_id;
        db.all(sql, [survey_id], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            user_id = rows[0].next_id;
            if (!user_id)
                user_id = 0;
            resolve(user_id);
        });
    });
};

// get answers to a survey for specific user id
exports.getAnswersToSurveyUser = (survey_id, user_id, next) => {
    return new Promise((resolve, reject) => {
        let sql = next ? 'SELECT id, username, answer, survey_id, question_id, user_id as user_id FROM ANSWERS WHERE survey_id=?' +
            'AND user_id = (SELECT MIN(user_id) FROM ANSWERS WHERE survey_id=? AND user_id>=?)' :
            'SELECT id, username, answer, survey_id, question_id, user_id as user_id FROM ANSWERS WHERE survey_id=? ' +
            'AND user_id = (SELECT MAX(user_id) FROM ANSWERS WHERE survey_id=? AND user_id<=?)';

        db.all(sql, [survey_id, survey_id, user_id], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            const answers = rows.map((a) => ({
                id: a.id, username: a.username, answer: a.answer, survey_id: a.survey_id,
                question_id: a.question_id, user_id: a.user_id
            }));
            resolve(answers);
        });
    });
};


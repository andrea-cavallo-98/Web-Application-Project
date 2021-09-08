


/* Surveys APIs */
async function getAllSurveys() {

    const response = await fetch('api/surveys');
    const surveysJson = await response.json();
    if (response.ok) {
        return surveysJson.map((s) => { return { id: s.id, title: s.title, admin_id: s.admin_id }; });
    } else {
        throw surveysJson;  // an object with the error coming from the server
    }
}

async function getAdminSurveys(admin_id) {

    const response = await fetch('api/admin-surveys/' + admin_id);
    const surveysJson = await response.json();
    if (response.ok) {
        return surveysJson.map((s) => { return { id: s.id, title: s.title, admin_id: s.admin_id, responses: s.responses }; });
    } else {
        throw surveysJson;  // an object with the error coming from the server
    }
}

async function getQuestions(id) {

    const response = await fetch('api/survey/' + id);
    const questionsJson = await response.json();
    if (response.ok) {
        return questionsJson.map((q) => { return { id: q.id, text: q.text, possible_answers: q.possible_answers, 
                                    s_id: q.s_id, min_ans: q.min_ans, max_ans: q.max_ans }; });
    } else {
        throw questionsJson;  // an object with the error coming from the server
    }
}


async function storeSurvey(survey) {

    fetch('/api/survey', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(survey)
    })
}


async function storeAnswersToSurvey(answers) {

    fetch('/api/answer-survey', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(answers)
    })
}


async function getAnswersToSurveyUser(survey_id, user_id, next) {

    const isNext = next? 1:0;
    const response = await fetch('api/answer-survey/' + survey_id + "/" + user_id + "/" + isNext);
    const answersJson = await response.json();
    if (response.ok) {
        return answersJson.map((a) => {
            return {
                id: a.id, username: a.username, answer: a.answer, survey_id: a.survey_id,
                question_id: a.question_id, user_id: a.user_id
            };
        });
    } else {
        throw answersJson;  // an object with the error coming from the server
    }
}


/* User APIs */

async function login(credentials) {
    let response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });
    if (response.ok) {
        const user = await response.json();
        return user.name;
    }
    else {
        const errDetails = await response.text();
        throw errDetails;
    }
}

async function logout() {
    let response = await fetch('/api/sessions/current', {
        method: 'delete',
    });
    if (response.ok)
        return (true);
    else
        return false;
}

async function getUserInfo() {
    const response = await fetch('/api/sessions/current_session');
    const userInfo = await response.json();
    if (response.ok) {
        return userInfo;
    } else {
        throw userInfo;  // an object with the error coming from the server
    }
}


const API = {
    getAllSurveys, getAdminSurveys, getQuestions, storeSurvey, storeAnswersToSurvey,
    getAnswersToSurveyUser, login, logout, getUserInfo
};
export default API;


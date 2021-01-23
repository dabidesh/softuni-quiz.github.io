import { getQuiz } from './data.js';
import html from './dom.js';


export default async function quizPage({ params: { id } }) {
    const quiz = await getQuiz(id);

    const input = {
        questions: html`
        <div>
            ${quiz.questions.map(quizQuestion)}
        </div>`,
        button: html`<button className="validate-btn" onClick=${validate}>Изпрати отговори</button>`
    };

    return html`
    <div>
        <h1>${quiz.name}</h1>
        <a className="nav" href="/">Назад към каталога</a>
        ${input.questions}
        ${input.button}
    </div>`;

    function validate() {
        const result = [...input.questions.children].map(c => c.validate());
        const correct = result.filter(e => e);
        input.button.textContent = `${correct.length} / ${result.length} верни отговора`;
    }
}

function quizQuestion(question, index) {
    const multi = question.answers.filter(a => a.correct).length > 1;

    question.answers = question.answers.map(a => ({ a, o: Math.random() }));
    if (!question.dontRandomize) {
        question.answers.sort(({ o: a }, { o: b }) => a - b);
    }

    const input = {
        answers: html`
        <div>
            ${question.answers.map((a, i) => quizAnswer(a.a, i, index, multi))}
        </div>`
    };

    const e = html`
        <div className="question">
            <h3>${parseToElement(question.text)}</h3>
            ${multi ? html`<span className="subtle">(изберете всички подходящи отговори)</span>` : ''}
            ${input.answers}
        </div>
        `;
    e.validate = validate;

    return e;

    function validate() {
        const correct = [...input.answers.children].map(c => c.validate()).reduce((a, c) => a && c, true);

        if (correct) {
            e.classList.add('correct');
            return true;
        } else {
            e.classList.add('wrong');
            return false;
        }
    }
}

function quizAnswer(answer, index, questionIndex, multi = false) {
    const inputType = multi ? 'checkbox' : 'radio';

    const e = html`
        <label className="answer">
            <input name=${'question' + questionIndex} type=${inputType} value=${index} />
            <span>${parseToElement(answer.text)}</span>
        </label>`;
    e.validate = validate;

    return e;

    function validate() {
        if (answer.correct) {
            e.classList.add('correct');
            if (e.children[0].checked) {
                e.classList.add('selected-correct');
                return true;
            } else {
                e.classList.remove('selected-correct');
                return false;
            }
        } else {
            if (e.children[0].checked) {
                e.classList.add('selected-wrong');
                return false;
            } else {
                e.classList.remove('selected-wrong');
                return true;
            }
        }
    }
}

function parseToElement(text) {
    //text = text.replace(/[<>&]/gi, sanitize);
    const tokens = text.split('`');

    if (tokens.length > 1) {
        const result = [];

        let open = false;
        for (let token of tokens) {
            if (!open) {
                result.push(token);
                open = true;
            } else {
                result.push(html`<span className="code">${token}</span>`);
                open = false;
            }
        }

        return html`<span className="answer-text">${result}</span>`;
    }

    return text;
}

function sanitize(match) {
    return {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;'
    }[match];
}
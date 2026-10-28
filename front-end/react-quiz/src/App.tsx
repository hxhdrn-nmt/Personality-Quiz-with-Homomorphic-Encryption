import './App.css'
import { useForm } from "./useForm";
import { useState, type ChangeEventHandler } from "react";
import quiz from "./quiz.json"

function Answer( answerData: {answer: string, questionIndex: number, onChange: ChangeEventHandler} ) {
  return (
    <div>
      <label>
        <input type="radio" name={answerData.questionIndex.toString()} onChange={answerData.onChange}/>
        {answerData.answer}
      </label>
    </div>
  );
}

function QuizQuestion(questionData: { index: number, question: string; answers: {index: number, answer: string}[], onChange: ChangeEventHandler }) {
  const quizAnswers = questionData.answers.map(answerData =>
    <Answer key={answerData.index} answer={answerData.answer} questionIndex={questionData.index} onChange={questionData.onChange}/>
  );

  return (
    <section key={questionData.index}>
      <h3>{questionData.question}</h3>
      {quizAnswers}
    </section>

  );
}

function QuizResults(result: {vals: number[]}) {
  return (
    <p>[{result.vals.join(", ")}]</p>
  );
}

function Quiz() {
  const { onChange, onSubmit, values } = useForm(quizSubmitCallback);
  const [isSubmitted, setSubmitted] = useState(false);

  async function quizSubmitCallback () {
    setSubmitted(true);
  }

  function answersFromJson(answers: string[]) {
    return answers.map((a, i) => ({
      index: i,
      answer: a
    }))
  }

  const quizQuestions = quiz.questions.map((question, i) => 
    <QuizQuestion key={i} index={i} question={question.question} answers = {answersFromJson(question.answers)} onChange = {onChange} />
  );

  return (
    <>
      <form onSubmit={onSubmit}>
        {quizQuestions}
        <button type="submit">Submit</button>
      </form>

      {isSubmitted && <QuizResults vals={values} /> }
    </>
  );
}

function App() {
  return (
    <>
      <Quiz />
    </>
  )
}

export default App

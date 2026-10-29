import './App.css'
import { useForm } from "./useForm";
import { useState, type ChangeEventHandler } from "react";
import quiz from "./quiz.json"

// A radio input component that represents the answer to a quiz question
function Answer( answerData: {answer: string, questionIndex: number, index: number, onChange: ChangeEventHandler} ) {
  return (
    <div>
      <label>
        <input type="radio" name={answerData.questionIndex.toString()} value={answerData.index} onChange={answerData.onChange}/>
        {answerData.answer}
      </label>
    </div>
  );
}

// A quiz question component including its radio input answers
function QuizQuestion(questionData: { index: number, question: string; answers: {index: number, answer: string}[], onChange: ChangeEventHandler }) {
  // convert answer data to Answer components
  const quizAnswers = questionData.answers.map(answerData =>
    <Answer key={answerData.index} answer={answerData.answer} index={answerData.index} questionIndex={questionData.index} onChange={questionData.onChange}/>
  );

  return (
    <section key={questionData.index}>
      <h3>{questionData.question}</h3>
      {quizAnswers}
    </section>

  );
}

// The results to the quiz (shown after submit is pressed)
function QuizResults(result: {vals: number[]}) {
  return (
    <p>[{result.vals.join(", ")}]</p>
  );
}

// The quiz including all its questions and answers
function Quiz() {
  const { onChange, onSubmit, values } = useForm(quizChangeCallback, quizSubmitCallback); // form state with listeners & value array (custom state defined in useForm.tsx)
  const [showResults, setShowResults] = useState(false); // boolean state value with setter for whether quiz has been submitted
  const [errorMsg, setErrorMsg] = useState(""); // string state value (show error if not empty)

  // called when the quiz is submitted
  async function quizSubmitCallback () {
    if (values.length < quiz.questions.length) {
      setErrorMsg("You must fill out all the questions to submit!");
    }
    else {
      setShowResults(true);
    }
  }

  // called when any answer in the quiz is changed
  async function quizChangeCallback() {
    setShowResults(false); // stop showing the result if the values get changed (they need to resubmit)
    setErrorMsg(""); // also remove the error
  }

  // converts json answers into answer data for the Answer component
  function answersFromJson(answers: string[]) {
    return answers.map((a, i) => ({
      index: i,
      answer: a
    }))
  }

  // gets quiz questions & answers from json, turns them into JSX components
  const quizQuestions = quiz.questions.map((question, i) => 
    <QuizQuestion key={i} index={i} question={question.question} answers = {answersFromJson(question.answers)} onChange = {onChange} />
  );

  return (
    <>
      {/* actual form defined here */}
      <form onSubmit={onSubmit}>
        {quizQuestions}
        <button type="submit">Submit</button>
      </form>

      {/* only show quiz results after submit button clicked (lazy eval && does this) */}
      {showResults && <QuizResults vals={values} /> }

      {/* show error message if error is set */}
      {errorMsg != "" && <p>{errorMsg}</p>}
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

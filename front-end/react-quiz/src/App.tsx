import './App.css'
import { useForm } from "./useForm";
import { useState, type ChangeEventHandler } from "react";
import quiz from "./quiz.json";
import type { PublicKey, PrivateKey } from './HomoEncrypt.ts';
import { genKeys, encArr, decrypt } from "./HomoEncrypt.ts";

const mode: number = 1; // 0 = unencrypted, 1 = encrypted, 2 = compare

function createSubmission(answers: number[]) {
  switch(mode) {
    case 0: // unencrypted
      return { submission: {encrypted: false, n: 0, g: 0, answers: answers }, keys: {pubKey: null, privKey: null} };
    case 1: // encrypted
      const {pubKey, privKey} = genKeys();
      const encAns = encArr(answers, pubKey);
      return { submission: { encrypted: true, n: pubKey.n, g: pubKey.g, answers: encAns }, keys: {pubKey: pubKey, privKey: privKey}};
  }
  return {submission: null, keys: {pubKey: null, privKey: null}}
}

function getResult(result: string, keys: {pubKey: PublicKey | null, privKey: PrivateKey | null}) {
  let res = BigInt(result);
  switch(mode) {
    case 0:
      return res;
    case 1:
      if (keys.pubKey != null && keys.privKey != null) {  
        res = decrypt(res, keys.pubKey, keys.privKey);
        return res;
      }
      else {
        console.error("Error: need keys in order to decrypt");
        return BigInt(-1);
      }
  }
  return BigInt(-1);
}

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
function QuizResults(result: {result: bigint}) {
  return (
    <p>You are {result.result}% Cryptanalyst!</p>
  );
}

// The quiz including all its questions and answers
function Quiz() {
  const structure = quiz.questions.map(q => q.answers.length)

  let pubKey: PublicKey | null
  let privKey: PrivateKey | null

  const { onChange, onSubmit, values } = useForm(quizChangeCallback, quizSubmitCallback, structure); // form state with listeners & value array (custom state defined in useForm.tsx)
  const [result, setResult] = useState(BigInt(-1)); // string score value
  const [errorMsg, setErrorMsg] = useState(""); // string state value (show error if not empty)

  // called when the quiz is submitted
  async function quizSubmitCallback () {
    setErrorMsg("");
    setResult(BigInt(-1));
    const answers = values.flat()
    if (answers.reduce<number>((acc, current) => acc + current, 0) < quiz.questions.length) {
      setErrorMsg("You must fill out all the questions to submit!");
    }
    else {
      try {
        const {submission, keys} = createSubmission(answers);
        pubKey = keys.pubKey;
        privKey = keys.privKey;
        const body = JSON.stringify(submission, (_key, value) => typeof(value) === "bigint" ? value.toString() : value);
        const response = await fetch("https://finished-excluding-afar.ngrok-free.dev/results/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
          },
          body: body,
        });

        if (!response.ok) {
          const errorDetail = await response.json();
          console.error("FastAPI 422 Detail:", JSON.stringify(errorDetail, null, 2));
        }
        else {
          const data = await response.json();
          const result = getResult(data.result, {pubKey, privKey: privKey})
          setResult(result);
        }

      } catch (err) {
        console.error("POST Error:", err);
      }
    }
  }

  // called when any answer in the quiz is changed
  async function quizChangeCallback() {
    setResult(BigInt(-1)); // stop showing the result if the values get changed (they need to resubmit)
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
      {result != BigInt(-1) && <QuizResults result={result} /> }

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

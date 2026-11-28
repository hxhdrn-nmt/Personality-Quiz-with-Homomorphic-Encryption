import './App.css'
import { useForm } from "./useForm";
import { useState, type ChangeEventHandler, /*useEffect */} from "react";
import quiz from "./quiz.json";
import type { PublicKey, PrivateKey } from './HomoEncrypt.ts';
import { genKeys, encArr, decrypt } from "./HomoEncrypt.ts";
// import type { FormAnswers } from './useForm'

function createSubmission(mode: number, answers: number[]) {
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

function getResult(mode: number, result: string, keys: {pubKey: PublicKey | null, privKey: PrivateKey | null}) : number {
  let res = BigInt(result);
  switch(mode) {
    case 0:
      return Number(res);
    case 1:
      if (keys.pubKey != null && keys.privKey != null) {  
        res = decrypt(res, keys.pubKey, keys.privKey);
        return Number(res);
      }
      else {
        console.error("Error: need keys in order to decrypt");
        return -1;
      }
  }
  return -1;
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
function QuizResults(result: {result: number}) {
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
  const [result, setResult] = useState(-1); // string score value
  const [errorMsg, setErrorMsg] = useState(""); // string state value (show error if not empty)

  // called when the quiz is submitted
  async function quizSubmitCallback () {
    setErrorMsg("");
    setResult(-1);
    const answers = values.flat()
    if (answers.reduce<number>((acc, current) => acc + current, 0) < quiz.questions.length) {
      setErrorMsg("You must fill out all the questions to submit!");
    }
    else {
      try {
        const {submission, keys} = createSubmission(1, answers);
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
          const result = getResult(1, data.result, {pubKey, privKey: privKey})
          setResult(result);
        }

      } catch (err) {
        console.error("POST Error:", err);
      }
    }
  }

  // called when any answer in the quiz is changed
  async function quizChangeCallback() {
    setResult(-1); // stop showing the result if the values get changed (they need to resubmit)
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
      {result != -1 && <QuizResults result={result} /> }

      {/* show error message if error is set */}
      {errorMsg != "" && <p>{errorMsg}</p>}
    </>
  );
}

// function genRandomAnswers() : FormAnswers {
//   const structure = quiz.questions.map(q => q.answers.length)
//   const answers: FormAnswers = [];
//   structure.forEach((q, i) => {
//       answers[i] = Array(q).fill(0);
//   })

//   for (let i = 0; i < quiz.questions.length; i++) {
//     const numAnswers = quiz.questions[i].answers.length;
//     const num = Math.floor(Math.random() * numAnswers);
//     answers[i][num] = 1;
//   }
  
//   return answers;
// }

// type BenchmarkData = { answers: number[], unencryptedResult: number, pubKey: PublicKey, privKey: PrivateKey, encryptedAnswers: bigint[], encryptedResult: bigint, decryptedResult: number, encryptedTime: number, unencryptedTime: number }

// function BenchmarkComponent() {

//   async function benchmark() : Promise<BenchmarkData> {
//     const data: BenchmarkData = {} as BenchmarkData
//     const values = genRandomAnswers();
//     data.answers = values.flat()
//     try {
//       const {submission, keys} = createSubmission(1, data.answers);
//       data.encryptedAnswers = submission?.answers as bigint[]
//       data.pubKey = keys.pubKey as PublicKey;
//       data.privKey = keys.privKey as PrivateKey;
//       let body = JSON.stringify(submission, (_key, value) => typeof(value) === "bigint" ? value.toString() : value);
//       let start = performance.now()
//       let response = await fetch("https://finished-excluding-afar.ngrok-free.dev/results/", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "ngrok-skip-browser-warning": "true"
//         },
//         body: body,
//       });

//       if (!response.ok) {
//         const errorDetail = await response.json();
//         console.error("FastAPI 422 Detail:", JSON.stringify(errorDetail, null, 2));
//       }
//       else {
//         const responseData = await response.json();
//         data.encryptedResult = BigInt(responseData.result);
//         data.decryptedResult = getResult(1, responseData.result, {pubKey: data.pubKey, privKey: data.privKey})
//         const end = performance.now()
//         data.encryptedTime = end - start;
//       }
      
//       const submission2 = { encrypted: false, n: data.pubKey.n, g: data.pubKey.g, answers: data.answers }
//       body = JSON.stringify(submission2, (_key, value) => typeof(value) === "bigint" ? value.toString() : value);
//       start = performance.now()
//       response = await fetch("https://finished-excluding-afar.ngrok-free.dev/results/", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "ngrok-skip-browser-warning": "true"
//         },
//         body: body,
//       });

//       if (!response.ok) {
//         const errorDetail = await response.json();
//         console.error("FastAPI 422 Detail:", JSON.stringify(errorDetail, null, 2));
//       }
//       else {
//         const responseData = await response.json();
//         data.unencryptedResult = getResult(0, responseData.result, {pubKey: data.pubKey, privKey: data.privKey});
//         const end = performance.now();
//         data.unencryptedTime = end - start;
//       }

//     } catch (err) {
//       console.error("POST Error:", err);
//     }
//     return data
//   }

//   async function runBenchmarks() {
//     const dataTable = Array<BenchmarkData>();
//     for (let i = 0; i < 20; i++) {
//       console.log("Running benchmark " + i.toString())
//       dataTable[i] = await(benchmark());
//     }
//     console.log("answers | n | g | lambda | mu | encrypted answers | encrypted result | decrypted result | encrypted time | unencrypted result | unencrypted time")
//     for (let i = 0; i < 20; i++) {
//       const dt = dataTable[i];
//       console.log(dt.answers.toString() + " | " + dt.pubKey.n.toString() + " | " + dt.pubKey.g + " | " + dt.privKey.lambda.toString() + " | " + dt.privKey.mu.toString() + " | " + dt.encryptedAnswers.toString() + " | " + dt.encryptedResult.toString() + " | " + dt.decryptedResult.toString() + " | " + dt.encryptedTime.toString() + " | " + dt.unencryptedResult.toString() + " | " + dt.unencryptedTime.toString());
//     }
//   }

//   useEffect(() => {
//     // Benchmarks should only run once
//     runBenchmarks();
//   }, []);

//   return <div>Benchmark Page</div>;
// }

function App() {
  return (
    <>
      < Quiz />
    </>
  )
}

export default App

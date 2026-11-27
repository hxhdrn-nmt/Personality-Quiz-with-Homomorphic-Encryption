import { useState } from "react";

type FormAnswers = Array<Array<0 | 1>>;

// Custom state that represents a list of multiple choice answers as an array of numbers
// Each number is the index of the answer to the question at that position
// (e.g. [1, 3] would represent picking the 2nd answer to the 1st question and the 4th answer to the 2nd question on a 2-question quiz)
// changeCallback is called after the values are modified
export const useForm = (changeCallback: any, submitCallback: any, questionStructure: number[]) => {
    const [values, setValues] = useState<FormAnswers>(() => {
        const answers: FormAnswers = [];
        questionStructure.forEach((q, i) => {
            answers[i] = Array(q).fill(0);
        })
        return answers;
    });

    const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVals = [...values] // make new copy since react doesn't like modifications to state objects
        const qInd = parseInt(event.target.name) // answer's name is its question index
        const ind = parseInt(event.target.value) // answer's value is its answer index
        newVals[qInd] = newVals[qInd].map(() => 0);
        newVals[qInd][ind] = 1;
        setValues(newVals);
        await changeCallback();
    };

    // callback pattern allows form state creator to specify what should happen when submit button is clicked
    const onSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault(); // this stops it from loading a new page
        await submitCallback();
    };

    return {
        onChange,
        onSubmit,
        values,
    };
}
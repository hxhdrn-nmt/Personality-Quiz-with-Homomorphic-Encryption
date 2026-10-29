import { useState } from "react";

// Custom state that represents a list of multiple choice answers as an array of numbers
// Each number is the index of the answer to the question at that position
// (e.g. [1, 3] would represent picking the 2nd answer to the 1st question and the 4th answer to the 2nd question on a 2-question quiz)
export const useForm = (callback: any, initialState: number[] = []) => {
    const [values, setValues] = useState(initialState);

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVals = [...values] // make new copy since react doesn't like modifications to state objects
        newVals[parseInt(event.target.name)] = parseInt(event.target.value); // an answer's name is its question index & value is its index within the question
        setValues(newVals);
    };

    // callback pattern allows form state creator to specify what should happen when submit button is clicked
    const onSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault(); // this stops it from loading a new page
        await callback();
    };

    return {
        onChange,
        onSubmit,
        values,
    };
}
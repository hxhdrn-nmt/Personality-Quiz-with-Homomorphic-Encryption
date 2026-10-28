import { useState } from "react";

export const useForm = (callback: any, initialState: number[] = []) => {
    const [values, setValues] = useState(initialState);

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVals = [...values]
        newVals[parseInt(event.target.name)] = parseInt(event.target.value);
        setValues(newVals);
    };

    const onSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        await callback();
    };

    return {
        onChange,
        onSubmit,
        values,
    };
}
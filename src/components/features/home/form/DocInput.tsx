import { type ChangeEvent } from "react"
import { TextInput } from "./fields"
import { formatDoc } from "./validation"

interface DocInputProps {
    value: string
    error?: string
    valid?: boolean
    required?: boolean
    onChange: (digits: string) => void
    onBlur?: () => void
}

export default function DocInput({ value, error, valid, required, onChange, onBlur }: DocInputProps) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 8)
        onChange(digits)
    }

    return (
        <TextInput
            label="N° de documento (DNI)"
            name="numeroDocumento"
            value={formatDoc(value)}
            error={error}
            valid={valid}
            required={required}
            inputMode="numeric"
            autoComplete="off"
            placeholder="00.000.000"
            onChange={handleChange}
            onBlur={onBlur}
        />
    )
}
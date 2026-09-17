import { type ChangeEvent } from "react"
import { TextInput } from "./fields"
import { formatCuil } from "./validation"

interface CuilInputProps {
    value: string
    error?: string
    valid?: boolean
    required?: boolean
    onChange: (digits: string) => void
    onBlur?: () => void
}

export default function CuilInput({ value, error, valid, required, onChange, onBlur }: CuilInputProps) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 11)
        onChange(digits)
    }

    return (
        <TextInput
            label="CUIL"
            name="cuil"
            value={formatCuil(value)}
            error={error}
            valid={valid}
            required={required}
            inputMode="numeric"
            autoComplete="off"
            placeholder="XX-XXXXXXXX-X"
            onChange={handleChange}
            onBlur={onBlur}
        />
    )
}
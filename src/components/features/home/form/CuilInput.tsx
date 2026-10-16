import { type ChangeEvent } from "react"
import { TextInput } from "./fields"
import { formatCuil } from "./validation"

interface CuilInputProps {
    label?: string
    placeholder?: string
    value: string
    error?: string
    valid?: boolean
    required?: boolean
    onChange: (digits: string) => void
    onBlur?: () => void
}

export default function CuilInput({ label = "CUIL", placeholder = "XX-XXXXXXXX-X", value, error, valid, required, onChange, onBlur }: CuilInputProps) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 11)
        onChange(digits)
    }

    return (
        <TextInput
            label={label}
            name="cuil"
            value={formatCuil(value)}
            error={error}
            valid={valid}
            required={required}
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder}
            onChange={handleChange}
            onBlur={onBlur}
        />
    )
}
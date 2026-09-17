import { useId, useState, useRef, useEffect, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react"
import { AlertCircle, CheckCircle2, ChevronDown, Search } from "lucide-react"

const inputBase =
    "block w-full h-12 px-4 sm:h-14 sm:px-5 rounded-2xl border bg-white text-sm text-gray-900 font-medium " +
    "transition-all duration-300 placeholder:text-gray-400"

function inputState(variant: "normal" | "error" | "valid"): string {
    switch (variant) {
        case "error":
            return "border-red-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/15"
        case "valid":
            return "border-emerald-400/70 focus:outline-none focus:border-[#4d0706] focus:ring-4 focus:ring-[#4d0706]/10"
        default:
            return "border-gray-200 focus:outline-none focus:border-[#4d0706] focus:ring-4 focus:ring-[#4d0706]/10"
    }
}

interface FieldShellProps {
    id: string
    label: string
    required?: boolean
    error?: string
    hint?: string
    children: ReactNode
}

export function FieldShell({ id, label, required, error, hint, children }: FieldShellProps) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-500">
                {label}
                {required && <span className="text-red-700" aria-hidden="true"> *</span>}
            </label>
            {children}
            {error ? (
                <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-red-700">
                    <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{error}</span>
                </p>
            ) : hint ? (
                <p className="mt-1.5 text-xs font-medium text-gray-500">{hint}</p>
            ) : null}
        </div>
    )
}

function ValidIcon({ className }: { className: string }) {
    return (
        <span aria-hidden="true" className={`pointer-events-none absolute inset-y-0 flex items-center ${className}`}>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </span>
    )
}

export interface TextInputProps {
    label: string
    name: string
    value: string
    type?: string
    inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"]
    autoComplete?: string
    placeholder?: string
    hint?: string
    error?: string
    valid?: boolean
    required?: boolean
    disabled?: boolean
    maxLength?: number
    max?: string
    min?: string
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void
    onBlur?: () => void
}

export function TextInput({
    label,
    name,
    value,
    type = "text",
    inputMode,
    autoComplete,
    placeholder,
    hint,
    error,
    valid,
    required,
    disabled,
    maxLength,
    max,
    min,
    onChange,
    onBlur,
}: TextInputProps) {
    const autoId = useId()
    const fieldId = `${name}-${autoId.replace(/:/g, "")}`
    const hasError = Boolean(error)
    const showCheck = Boolean(valid) && !hasError
    const cls = `${inputBase} ${inputState(hasError ? "error" : valid ? "valid" : "normal")} ${showCheck ? "pr-12" : ""}`

    return (
        <FieldShell id={fieldId} label={label} required={required} error={error} hint={hint}>
            <div className="relative">
                <input
                    id={fieldId}
                    name={name}
                    type={type}
                    value={value}
                    inputMode={inputMode}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    disabled={disabled}
                    maxLength={maxLength}
                    max={max}
                    min={min}
                    required={required}
                    aria-required={required || undefined}
                    aria-invalid={hasError || undefined}
                    aria-describedby={hasError ? `${fieldId}-error` : undefined}
                    onChange={onChange}
                    onBlur={onBlur}
                    className={cls}
                />
                {showCheck && <ValidIcon className="right-4" />}
            </div>
        </FieldShell>
    )
}

export interface SelectOption {
    value: string
    label: string
}

export interface SelectInputProps {
    label: string
    name: string
    value: string
    options: SelectOption[]
    placeholderOption?: string
    hint?: string
    error?: string
    valid?: boolean
    required?: boolean
    onChange?: (e: ChangeEvent<HTMLSelectElement>) => void
    onBlur?: () => void
}

export function SelectInput({
    label,
    name,
    value,
    options,
    placeholderOption,
    hint,
    error,
    valid,
    required,
    onChange,
    onBlur,
}: SelectInputProps) {
    const autoId = useId()
    const fieldId = `${name}-${autoId.replace(/:/g, "")}`
    const hasError = Boolean(error)
    const cls = `${inputBase} appearance-none cursor-pointer pr-12 ${inputState(hasError ? "error" : valid ? "valid" : "normal")}`

    return (
        <FieldShell id={fieldId} label={label} required={required} error={error} hint={hint}>
            <div className="relative">
                <select
                    id={fieldId}
                    name={name}
                    value={value}
                    required={required}
                    aria-required={required || undefined}
                    aria-invalid={hasError || undefined}
                    aria-describedby={hasError ? `${fieldId}-error` : undefined}
                    onChange={onChange}
                    onBlur={onBlur}
                    className={cls}
                >
                    {placeholderOption && (
                        <option value="" disabled>{placeholderOption}</option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                    <ChevronDown className="h-4 w-4" />
                </span>
            </div>
        </FieldShell>
    )
}

export interface SearchableSelectProps {
    label: string
    name: string
    value: string
    options: SelectOption[]
    placeholderOption?: string
    hint?: string
    error?: string
    valid?: boolean
    required?: boolean
    onChange?: (value: string) => void
    onBlur?: () => void
}

export function SearchableSelect({
    label,
    name,
    value,
    options,
    placeholderOption,
    hint,
    error,
    valid,
    required,
    onChange,
    onBlur,
}: SearchableSelectProps) {
    const autoId = useId()
    const fieldId = `${name}-${autoId.replace(/:/g, "")}`
    const listId = `${fieldId}-list`
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [dirty, setDirty] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const hasError = Boolean(error)
    const showCheck = Boolean(valid) && !hasError

    useEffect(() => {
        const onDocMouseDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener("mousedown", onDocMouseDown)
        return () => document.removeEventListener("mousedown", onDocMouseDown)
    }, [])

    const selected = options.find((o) => o.value === value)
    const display = dirty ? query : (selected?.label ?? "")
    const searchText = (dirty ? query : "").trim().toLowerCase()
    const filtered =
        searchText === ""
            ? options
            : options.filter((o) => o.label.toLowerCase().includes(searchText))

    const selectOption = (opt: SelectOption) => {
        onChange?.(opt.value)
        setQuery(opt.label)
        setDirty(false)
        setOpen(false)
    }

    const cls = `${inputBase} pl-11 ${showCheck ? "pr-12" : "pr-10"} cursor-text ${inputState(hasError ? "error" : valid ? "valid" : "normal")}`

    return (
        <FieldShell id={fieldId} label={label} required={required} error={error} hint={hint}>
            <div ref={containerRef} className="relative">
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
                    <Search className="h-4 w-4" />
                </span>
                <input
                    id={fieldId}
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    value={display}
                    autoComplete="off"
                    placeholder={placeholderOption}
                    required={required}
                    aria-required={required || undefined}
                    aria-invalid={hasError || undefined}
                    aria-describedby={hasError ? `${fieldId}-error` : undefined}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setDirty(true)
                        setOpen(true)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            // Select first filtered option on Enter
                            if (open && filtered.length > 0) {
                                selectOption(filtered[0])
                            }
                        }
                        if (e.key === "Escape") {
                            setOpen(false)
                        }
                    }}
                    onFocus={() => {
                        setOpen(true)
                        setQuery("")
                        setDirty(true)
                    }}
                    onBlur={() => {
                        onBlur?.()
                        setOpen(false)
                    }}
                    className={cls}
                />
                {showCheck && (
                    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-11 flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </span>
                )}
                <span aria-hidden="true" className={`pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
                    <ChevronDown className="h-4 w-4" />
                </span>
                {open && (
                    <div
                        id={listId}
                        role="listbox"
                        className="absolute z-20 mt-2 w-full max-h-60 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl"
                    >
                        {placeholderOption && searchText === "" && (
                            <div className="px-4 pt-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                                {placeholderOption}
                            </div>
                        )}
                        {filtered.length > 0 ? (
                            filtered.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    role="option"
                                    aria-selected={opt.value === value}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => selectOption(opt)}
                                    className={`block w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                                        opt.value === value
                                            ? "bg-[#4d0706]/5 text-[#4d0706]"
                                            : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm font-medium text-gray-400">Sin resultados</div>
                        )}
                    </div>
                )}
            </div>
        </FieldShell>
    )
}

export interface TextAreaInputProps {
    label: string
    name: string
    value: string
    placeholder?: string
    hint?: string
    error?: string
    required?: boolean
    rows?: number
    onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
    onBlur?: () => void
}

export function TextAreaInput({
    label,
    name,
    value,
    placeholder,
    hint,
    error,
    required,
    rows = 3,
    onChange,
    onBlur,
}: TextAreaInputProps) {
    const autoId = useId()
    const fieldId = `${name}-${autoId.replace(/:/g, "")}`
    const hasError = Boolean(error)
    const cls = `block w-full p-4 rounded-2xl border bg-white text-sm text-gray-900 font-medium transition-all duration-300 placeholder:text-gray-400 ${inputState(
        hasError ? "error" : "normal"
    )}`

    return (
        <FieldShell id={fieldId} label={label} required={required} error={error} hint={hint}>
            <textarea
                id={fieldId}
                name={name}
                value={value}
                rows={rows}
                placeholder={placeholder}
                required={required}
                aria-required={required || undefined}
                aria-invalid={hasError || undefined}
                aria-describedby={hasError ? `${fieldId}-error` : undefined}
                onChange={onChange}
                onBlur={onBlur}
                className={cls}
            />
        </FieldShell>
    )
}
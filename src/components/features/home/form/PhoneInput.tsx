import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { ChevronDown, CheckCircle2, Search } from "lucide-react"
import {
    AsYouType,
    getCountryCallingCode,
    parsePhoneNumber,
    type CountryCode,
} from "libphonenumber-js"
import { useId } from "react"
import { FieldShell } from "./fields"
import { COUNTRIES, detectCountry, flagEmoji, maxNationalDigits, type CountryEntry } from "./phone"

interface PhoneInputProps {
    label: string
    name: string
    value: string
    autoComplete?: string
    hint?: string
    error?: string
    valid?: boolean
    required?: boolean
    onChange: (e164: string) => void
    onBlur?: () => void
}

export function PhoneInput({
    label,
    name,
    value,
    autoComplete,
    hint,
    error,
    valid,
    required,
    onChange,
    onBlur,
}: PhoneInputProps) {
    const autoId = useId()
    const fieldId = `${name}-${autoId.replace(/:/g, "")}`
    const listId = `${fieldId}-list`

    const containerRef = useRef<HTMLDivElement | null>(null)

    const [country, setCountry] = useState<string>(() => detectCountry())
    const [digits, setDigits] = useState("")
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")

    const hasError = Boolean(error)
    const showCheck = Boolean(valid) && !hasError
    const cc = getCountryCallingCode(country as CountryCode)

    const { formatted, mask } = useMemo(() => {
        const at = new AsYouType(country as CountryCode)
        let out = ""
        for (const d of digits) out = at.input(d)
        return { formatted: out, mask: at }
    }, [country, digits])

    const currentEmitted = useMemo(() => {
        if (!digits) return ""
        const number = mask.getNumber()
        return number ? number.number : `+${cc}${digits}`
    }, [mask, cc, digits])

    const [lastValue, setLastValue] = useState(value)
    if (value !== lastValue && value !== currentEmitted) {
        setLastValue(value)
        if (value === "") {
            setDigits("")
            setCountry(detectCountry())
        } else {
            try {
                const parsed = parsePhoneNumber(value)
                const countryIso = parsed?.country
                if (countryIso) {
                    setCountry(countryIso)
                    setDigits(parsed.nationalNumber)
                } else {
                    setCountry(detectCountry())
                    setDigits(value.replace(/\D/g, ""))
                }
            } catch {
                setCountry(detectCountry())
                setDigits(value.replace(/\D/g, ""))
            }
        }
    }

    useEffect(() => {
        const onDocMouseDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener("mousedown", onDocMouseDown)
        return () => document.removeEventListener("mousedown", onDocMouseDown)
    }, [])

    const limitDigits = (iso: CountryCode, raw: string): string => {
        return raw.replace(/\D/g, "").slice(0, maxNationalDigits(iso))
    }

    const buildE164 = (iso: CountryCode, rawDigits: string): string => {
        if (!rawDigits) return ""
        const at = new AsYouType(iso)
        for (const d of rawDigits) at.input(d)
        const number = at.getNumber()
        return number ? number.number : `+${getCountryCallingCode(iso)}${rawDigits}`
    }

    const handleNumberChange = (raw: string) => {
        const limited = limitDigits(country as CountryCode, raw)
        setDigits(limited)
        onChange(buildE164(country as CountryCode, limited))
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") setOpen(false)
        if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault()
        }
    }

    const selectCountry = (c: CountryEntry) => {
        const limited = limitDigits(c.iso as CountryCode, digits)
        setCountry(c.iso)
        setDigits(limited)
        setQuery("")
        setOpen(false)
        onChange(buildE164(c.iso as CountryCode, limited))
    }

    const q = query.trim().toLowerCase()
    const filtered =
        q === ""
            ? COUNTRIES
            : COUNTRIES.filter(
                  (c) =>
                      c.name.toLowerCase().includes(q) ||
                      c.iso.toLowerCase() === q ||
                      c.callingCode === q
              )

    const borderCls = hasError
        ? "border-red-400 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/15"
        : valid
          ? "border-emerald-400/70 focus-within:border-[#4d0706] focus-within:ring-4 focus-within:ring-[#4d0706]/10"
          : "border-gray-200 focus-within:border-[#4d0706] focus-within:ring-4 focus-within:ring-[#4d0706]/10"

    return (
        <div ref={containerRef} className="relative">
            <FieldShell id={fieldId} label={label} required={required} error={error} hint={hint}>
                <div className={`flex items-stretch rounded-2xl border bg-white transition-all duration-300 ${borderCls}`}>
                    <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={open}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setOpen((o) => !o)}
                        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-l-2xl bg-transparent px-3 hover:bg-gray-50"
                    >
                        <span aria-hidden="true" className="mt-0.5 text-lg leading-none">
                            {flagEmoji(country)}
                        </span>
                        <span className="whitespace-nowrap text-sm font-bold tabular-nums text-gray-700">+{cc}</span>
                        <ChevronDown
                            aria-hidden="true"
                            className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                        />
                    </button>

                    <span aria-hidden="true" className="my-auto h-6 w-px shrink-0 bg-gray-200" />

                    <input
                        id={fieldId}
                        name={name}
                        value={formatted}
                        inputMode="numeric"
                        maxLength={maxNationalDigits(country)}
                        autoComplete={autoComplete}
                        placeholder="Número"
                        required={required}
                        aria-required={required || undefined}
                        aria-invalid={hasError || undefined}
                        aria-describedby={hasError ? `${fieldId}-error` : undefined}
                        aria-controls={open ? listId : undefined}
                        aria-expanded={open}
                        role={open ? "combobox" : undefined}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => handleNumberChange(e.target.value)}
                        onBlur={(e) => {
                            onBlur?.()
                            if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
                                setOpen(false)
                            }
                        }}
                        className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 sm:h-14"
                    />

                    {showCheck && (
                        <span aria-hidden="true" className="pointer-events-none flex items-center pr-4">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        </span>
                    )}
                </div>

                {open && (
                    <div id={listId} role="listbox" className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl">
                        <div className="border-b border-gray-100 p-2">
                            <div className="relative">
                                <Search
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Escape") setOpen(false)
                                    }}
                                    placeholder="Buscar país o +54"
                                    className="w-full rounded-xl border border-gray-100 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-[#4d0706]"
                                />
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto py-1">
                            {filtered.length > 0 ? (
                                filtered.map((c) => (
                                    <button
                                        key={c.iso}
                                        type="button"
                                        role="option"
                                        aria-selected={c.iso === country}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => selectCountry(c)}
                                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                            c.iso === country
                                                ? "bg-[#4d0706]/5 text-[#4d0706]"
                                                : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        <span aria-hidden="true" className="text-base leading-none">
                                            {flagEmoji(c.iso)}
                                        </span>
                                        <span className="flex-1 truncate text-sm font-medium">{c.name}</span>
                                        <span className="text-xs font-bold tabular-nums text-gray-400">{c.callingCode}</span>
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm font-medium text-gray-400">Sin resultados</div>
                            )}
                        </div>
                    </div>
                )}
            </FieldShell>
        </div>
    )
}
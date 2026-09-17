import { Check } from "lucide-react"

export interface StepperStep {
    title: string
}

interface StepperProps {
    steps: StepperStep[]
    current: number
    completed: number[]
}

export default function Stepper({ steps, current, completed }: StepperProps) {
    return (
        <ol className="flex w-full items-center" aria-label="Progreso de la inscripción">
            {steps.map((step, i) => {
                const index = i + 1
                const isLast = index === steps.length
                const isCurrent = index === current
                const isDone = completed.includes(index)
                const lineDone = index < current || isDone

                const circleClass = isDone
                    ? "border-[#4d0706] bg-[#4d0706] text-[#ffcc00]"
                    : isCurrent
                      ? "border-[#ffcc00] bg-[#ffcc00] text-[#4d0706] ring-4 ring-[#ffcc00]/30"
                      : "border-2 border-gray-300 bg-white text-gray-400"

                return (
                    <li
                        key={index}
                        aria-current={isCurrent ? "step" : undefined}
                        aria-label={step.title}
                        className="flex min-w-0 flex-1 items-center last:flex-none"
                    >
                        <div className="flex items-center gap-3">
                            <span
                                aria-hidden="true"
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors duration-300 ${circleClass}`}
                            >
                                {isDone ? <Check className="h-4 w-4" /> : index}
                            </span>
                            <span className={`hidden text-left sm:block ${isCurrent || isDone ? "" : "opacity-60"}`}>
                                <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400">
                                    Paso {index}
                                </span>
                                <span className={`block text-xs font-black leading-tight ${isCurrent || isDone ? "text-[#4d0706]" : "text-gray-400"}`}>
                                    {step.title}
                                </span>
                            </span>
                        </div>
                        {!isLast && (
                            <div
                                aria-hidden="true"
                                className={`mx-3 h-0.5 flex-1 rounded-full transition-colors duration-300 ${lineDone ? "bg-[#4d0706]/25" : "bg-gray-200"}`}
                            />
                        )}
                    </li>
                )
            })}
        </ol>
    )
}
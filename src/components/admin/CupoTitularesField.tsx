interface Props {
    titulares: number
    suplentes: number
}

export default function CupoTitularesField({ titulares, suplentes }: Props) {
    return (
        <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Titulares</p>
                <p className="mt-0.5 text-2xl font-black text-[#4d0706] tracking-tight tabular-nums">{titulares}</p>
            </div>
            <div className="w-px h-8 bg-gray-200 shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Suplentes</p>
                <p className="mt-0.5 text-2xl font-black text-amber-600 tracking-tight tabular-nums">{suplentes}</p>
            </div>
        </div>
    )
}

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { CONTRACT_CONTENT } from "./contractContent"
import { LOGO_OBREROS_PORVENIR, LOGO_SOCORROS_MUTUOS, FIRMA_REPRESENTANTE_LEGAL } from "./contractAssets"

export interface ContractPDFProps {
    fullName: string
    dni: string
    address: string
    departamento?: string
    celular?: string
    birthDate: string
    email: string
    courseName: string
    currentDate: string
}

const styles = StyleSheet.create({
    page: {
        paddingTop: 32,
        paddingBottom: 36,
        paddingHorizontal: 40,
        fontFamily: "Helvetica",
        fontSize: 9,
        lineHeight: 1.35,
        color: "#1f2937",
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1.5,
        borderBottomColor: "#4d0706",
    },
    headerLogoLeft: {
        width: 32,
        height: 64,
        objectFit: "contain",
    },
    headerLogoRight: {
        width: 64,
        height: 42,
        objectFit: "contain",
    },
    headerCenter: {
        flex: 1,
        textAlign: "center",
        paddingHorizontal: 8,
    },
    headerSchool: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#4d0706",
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },
    headerAddress: {
        fontSize: 8.5,
        color: "#4b5563",
        marginTop: 2,
    },
    headerTitle: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#111827",
        marginTop: 4,
        textTransform: "uppercase",
    },
    paragraph: {
        textAlign: "justify",
        marginBottom: 8,
        fontSize: 9,
        lineHeight: 1.4,
    },
    value: {
        fontWeight: "bold",
        color: "#000000",
    },
    fechaRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 4,
        marginBottom: 10,
    },
    fechaText: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#374151",
    },
    clause: {
        marginBottom: 7,
    },
    clauseHeading: {
        fontSize: 9,
        fontWeight: "bold",
        textAlign: "justify",
        lineHeight: 1.3,
        color: "#111827",
    },
    clauseItem: {
        fontSize: 8.5,
        textAlign: "justify",
        lineHeight: 1.3,
        marginTop: 2,
        paddingLeft: 8,
        color: "#1f2937",
    },
    clauseBody: {
        fontSize: 8.5,
        textAlign: "justify",
        lineHeight: 1.3,
        marginTop: 3,
        color: "#1f2937",
    },
    firmasContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginTop: 18,
        paddingTop: 8,
    },
    firmaBox: {
        width: "30%",
        alignItems: "center",
        justifyContent: "flex-end",
        minHeight: 60,
    },
    firmaImage: {
        width: 100,
        height: 44,
        objectFit: "contain",
        marginBottom: -6,
    },
    firmaLine: {
        width: "100%",
        borderBottomWidth: 1,
        borderBottomColor: "#4b5563",
        marginBottom: 4,
    },
    firmaLabel: {
        fontSize: 8.5,
        fontWeight: "bold",
        color: "#111827",
        textAlign: "center",
    },
    firmaSub: {
        fontSize: 7.5,
        color: "#6b7280",
        textAlign: "center",
        marginTop: 1,
    },
})

interface IntroSegment {
    text: string
    isVariable?: boolean
}

function valuesFor(data: ContractPDFProps): Record<string, string> {
    return {
        ALUMNO: data.fullName || "________________________",
        DNI: data.dni || "__________",
        DOMICILIO: data.address || "________________________",
        DEPARTAMENTO: data.departamento || "__________",
        CELULAR: data.celular || "__________",
        FECHA_NACIMIENTO: data.birthDate || "__________",
        EMAIL: data.email || "__________",
        CURSO: data.courseName || "________________________",
    }
}

function introSegments(data: ContractPDFProps): IntroSegment[] {
    const values = valuesFor(data)
    return CONTRACT_CONTENT.intro
        .split(/(<[A-Z_]+>)/)
        .filter((token) => token.length > 0)
        .map((token) => {
            const match = /^<([A-Z_]+)>$/.exec(token)
            if (!match) return { text: token, isVariable: false }
            const key = match[1]
            return { text: values[key] ?? "", isVariable: true }
        })
}

function IntroParagraph({ data }: { data: ContractPDFProps }) {
    return (
        <Text style={styles.paragraph}>
            {introSegments(data).map((segment, index) =>
                segment.isVariable ? (
                    <Text key={index} style={styles.value}>
                        {segment.text}
                    </Text>
                ) : (
                    <Text key={index}>{segment.text}</Text>
                )
            )}
        </Text>
    )
}

export default function ContractPDFDocument(data: ContractPDFProps) {
    return (
        <Document
            title={`Contrato de Servicio - ${data.fullName || "Alumno"}`}
            subject="Contrato de Prestación de Servicios Educativos"
            author="Escuela de Capacitación Laboral Obreros del Porvenir"
            creator="Escuela de Capacitación Laboral Obreros del Porvenir"
            producer="Escuela de Capacitación Laboral Obreros del Porvenir"
        >
            <Page size="A4" style={styles.page}>
                <View style={styles.headerRow}>
                    <Image src={LOGO_OBREROS_PORVENIR} style={styles.headerLogoLeft} />
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerSchool}>{CONTRACT_CONTENT.header[0]}</Text>
                        <Text style={styles.headerAddress}>{CONTRACT_CONTENT.header[1]}</Text>
                        <Text style={styles.headerTitle}>{CONTRACT_CONTENT.header[2]}</Text>
                    </View>
                    <Image src={LOGO_SOCORROS_MUTUOS} style={styles.headerLogoRight} />
                </View>

                <IntroParagraph data={data} />

                <View style={styles.fechaRow}>
                    <Text style={styles.fechaText}>FECHA: {data.currentDate}</Text>
                </View>

                {CONTRACT_CONTENT.clauses.map((clause, index) => (
                    <View key={index} style={styles.clause}>
                        <Text style={styles.clauseHeading}>{clause.heading}</Text>
                        {clause.items?.map((item, itemIndex) => (
                            <Text key={itemIndex} style={styles.clauseItem}>
                                {"\u00A0 \u2022 "}
                                {item}
                            </Text>
                        ))}
                        {clause.body
                            ? clause.body.split("\n").map((line, lineIndex) => (
                                  <Text key={lineIndex} style={styles.clauseBody}>
                                      {line}
                                  </Text>
                              ))
                            : null}
                    </View>
                ))}

                <View style={styles.firmasContainer} wrap={false}>
                    <View style={styles.firmaBox}>
                        <View style={styles.firmaLine} />
                        <Text style={styles.firmaLabel}>Firma del Alumno</Text>
                        <Text style={styles.firmaSub}>Aclaración y DNI</Text>
                    </View>
                    <View style={styles.firmaBox}>
                        <Image src={FIRMA_REPRESENTANTE_LEGAL} style={styles.firmaImage} />
                        <View style={styles.firmaLine} />
                        <Text style={styles.firmaLabel}>Firma Rep. Legal</Text>
                        <Text style={styles.firmaSub}>Ing. Alfio Berardinelli</Text>
                    </View>
                    <View style={styles.firmaBox}>
                        <View style={styles.firmaLine} />
                        <Text style={styles.firmaLabel}>Padre / Tutor</Text>
                        <Text style={styles.firmaSub}>Firma y Aclaración</Text>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
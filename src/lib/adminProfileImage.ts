const PROFILE_IMAGE_KEY = "obreros_admin_profile_image"

let current: string | null = null
let loaded = false
const listeners = new Set<() => void>()

function read(): string | null {
    if (!loaded) {
        try {
            current = localStorage.getItem(PROFILE_IMAGE_KEY)
        } catch {
            current = null
        }
        loaded = true
    }
    return current
}

function emit() {
    listeners.forEach((l) => l())
}

export function getAdminProfileImage(): string | null {
    return read()
}

export function setAdminProfileImage(value: string | null) {
    current = value
    loaded = true
    try {
        if (value) localStorage.setItem(PROFILE_IMAGE_KEY, value)
        else localStorage.removeItem(PROFILE_IMAGE_KEY)
    } catch {
        // ignore storage failures
    }
    emit()
}

export function subscribeAdminProfileImage(listener: () => void): () => void {
    read()
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}


import {toast} from "@/lib/toast/toast";

/*
|--------------------------------------------------------------------------
| ellipsis
|--------------------------------------------------------------------------
|
| Truncates a given text to a specific number of words and appends
| an ellipsis (...) at the end.
|
*/
export const ellipsis = (text: string, size: number) => {
    return `${text.split(" ").slice(0, size).join(" ")}...`;
};

/*
|--------------------------------------------------------------------------
| idGenerator
|--------------------------------------------------------------------------
|
| Generates a new incremental ID based on existing items.
|
*/
export const idGenerator = (events: { id: string }[], length = 1) => {
    const arrayData: number[] = [];

    events.forEach((data) => {
        arrayData.push(parseInt(data.id, 10));
    });

    const number = (Math.max(...arrayData) + 1).toString();

    return number.length < length
        ? `${"0".repeat(length - number.length)}${number}`
        : number;
};

/*
|--------------------------------------------------------------------------
| statusColor
|--------------------------------------------------------------------------
|
| Returns the Ant Design Tag color corresponding to a given order status.
|
*/
export const statusColor = (statusKey?: string): string => {
    switch (statusKey) {
        case 'new':
            return 'blue'
        case 'preparing':
            return 'orange'
        case 'ready':
            return 'purple'
        case 'delivered':
            return 'green'
        case 'canceled':
            return 'red'
        default:
            return 'default'
    }
}

/*
|--------------------------------------------------------------------------
| Sanitize Phone
|--------------------------------------------------------------------------
|
| Sanitizes phone number by removing non-digit characters.
|
*/
export const sanitizePhone = (phone?: string | number): string => {
    if (!phone) return ''
    return String(phone).replace(/\D/g, '')
}

/*
|--------------------------------------------------------------------------
| Format Phone Number
|--------------------------------------------------------------------------
|
| Formats a phone number string for clean UI display.
|
*/
export const formatPhoneNumber = (phone?: string | number): string => {
    if (!phone) return '-'
    const cleaned = sanitizePhone(phone)
    if (!cleaned) return '-'

    if (cleaned.startsWith('966') && cleaned.length === 12) {
        return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
    }
    if (cleaned.startsWith('05') && cleaned.length === 10) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
    }

    return String(phone)
}

/*
|--------------------------------------------------------------------------
| Get WhatsApp Link
|--------------------------------------------------------------------------
|
| Generates a direct WhatsApp URL with optional default text.
|
*/
export const getWhatsAppLink = (phone?: string | number, defaultMessage?: string): string | null => {
    const cleanPhone = sanitizePhone(phone)
    if (!cleanPhone) return null
    const textParam = defaultMessage ? `?text=${encodeURIComponent(defaultMessage)}` : ''
    return `https://wa.me/${cleanPhone}${textParam}`
}

/*
|--------------------------------------------------------------------------
| Copy To Clipboard
|--------------------------------------------------------------------------
|
| Copies a given text string to system clipboard with navigator fallback.
|
*/
export const copyToClipboard = async (text?: string): Promise<boolean> => {
    if (!text) return false

    try {
        if (navigator?.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text)
            return true
        } else {
            const textArea = document.createElement('textarea')
            textArea.value = text
            textArea.style.position = 'fixed'
            textArea.style.left = '-999999px'
            textArea.style.top = '-999999px'
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()
            const successful = document.execCommand('copy')
            textArea.remove()
            return successful
        }
    } catch {
        return false
    }
}

/*
|--------------------------------------------------------------------------
| Handle Copy Action
|--------------------------------------------------------------------------
|
| Handles copy action with UI state feedback and optional success toast.
|
*/
export const handleCopyAction = async (
    text?: string,
    onSuccessState?: (val: boolean) => void,
    successMessage?: string
): Promise<boolean> => {
    if (!text) return false
    const isCopied = await copyToClipboard(text)

    if (isCopied) {
        if (onSuccessState) {
            onSuccessState(true)
            setTimeout(() => onSuccessState(false), 2000)
        }
        if (successMessage) {
            toast.success({ message: successMessage, })
        }
    }

    return isCopied
}

/*
|--------------------------------------------------------------------------
| Build Location Name
|--------------------------------------------------------------------------
|
| Constructs location string from city, region, and country parameters.
|
*/
export const buildLocationName = (
    city?: string,
    region?: string,
    country?: string,
    fallback: string = 'Location'
): string => {
    const parts = [city, region, country].filter(Boolean)
    return parts.length > 0 ? parts.join(' ').trim() : fallback
}

/*
|--------------------------------------------------------------------------
| Get Google Maps URL
|--------------------------------------------------------------------------
|
| Returns Google Maps web search link for address or query string.
|
*/
export const getGoogleMapsUrl = (addressOrQuery?: string): string => {
    if (!addressOrQuery) return '#'
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressOrQuery)}`
}

/*
|--------------------------------------------------------------------------
| Get Map Embed URL
|--------------------------------------------------------------------------
|
| Builds an iframe embed URL for inline Google Map display.
|
*/
export const getMapEmbedUrl = (addressOrQuery?: string, zoom: number = 15): string => {
    if (!addressOrQuery) return ''
    return `https://maps.google.com/maps?q=${encodeURIComponent(addressOrQuery)}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`
}

/*
|--------------------------------------------------------------------------
| Format Date
|--------------------------------------------------------------------------
|
| Formats date input string/timestamp into localized standard representation.
|
*/
export const formatDate = (dateInput?: string | Date | number, includeTime: boolean = false, locale: string = 'ar'): string => {
    if (!dateInput) return '-'
    const date = new Date(dateInput)
    if (isNaN(date.getTime())) return '-'

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(includeTime && { hour: '2-digit', minute: '2-digit' })
    }

    return new Intl.DateTimeFormat(locale, options).format(date)
}
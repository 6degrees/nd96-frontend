import dayjs from 'dayjs';

/*
|--------------------------------------------------------------------------
| formatRange
|--------------------------------------------------------------------------
|
| Formats date range for API queries (Django style).
| Example: 2026-01-01,2026-01-15
|
*/
export const formatRange = (range: any) => {
    return range?.[0] && range?.[1]
        ? `${dayjs(range[0]).format("YYYY-MM-DD")},${dayjs(range[1]).format("YYYY-MM-DD")}`
        : undefined;
};

/*
|--------------------------------------------------------------------------
| formatDate
|--------------------------------------------------------------------------
|
| Formats single date or datetime value.
|
*/
export const formatDate = (date?: string, withTime = false) => {
    if (!date) return undefined

    return dayjs(date).format(withTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD')
}

/*
|--------------------------------------------------------------------------
| formatPhoneNumber
|--------------------------------------------------------------------------
|
| Formats phone number strings for clean bidirectional (BiDi) display.
| Example: +966920034002 -> +966 9200 34002
|
*/
export const formatPhoneNumber = (phone?: string | null) => {
    if (!phone) return '-';

    const cleaned = phone.replace(/\s+/g, '');

    if (cleaned.startsWith('+966') || cleaned.startsWith('966')) {
        const raw = cleaned.startsWith('+') ? cleaned.slice(4) : cleaned.slice(3);

        if (raw.startsWith('9200')) {
            return `+966 ${raw.slice(0, 4)} ${raw.slice(4)}`;
        }

        if (raw.startsWith('5') || raw.startsWith('05')) {
            const num = raw.startsWith('0') ? raw.slice(1) : raw;
            return `+966 ${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5)}`;
        }
    }

    return phone;
};
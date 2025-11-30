
export const escapeCell = (cell: any, delimiter: string): string => {
    if (cell == null) {
        return '';
    }
    const str = String(cell);
    // If the cell contains the delimiter, a quote, or a newline, wrap it in quotes.
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export const convertToDelimitedString = (data: any[], headers: Record<string, string>, delimiter: string): string => {
    const headerValues = Object.values(headers);
    const headerKeys = Object.keys(headers);

    const rows = data.map(item => {
        return headerKeys.map(key => {
            const keys = key.split('.');
            let value = item;
            for (const k of keys) {
                if (value == null) {
                    value = undefined;
                    break;
                }
                value = value[k];
            }
            return escapeCell(value, delimiter);
        }).join(delimiter);
    });
    return [headerValues.join(delimiter), ...rows].join('\r\n');
};

export const downloadFile = (content: string, filename: string) => {
    // BOM for UTF-8 to ensure Excel opens it correctly with special characters.
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

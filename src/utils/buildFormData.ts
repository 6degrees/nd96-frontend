export const buildFormData = (
    data: Record<string, any>,
    formData = new FormData(),
    parentKey = '',
): FormData => {

    Object.entries(data).forEach(
        ([key, value]) => {

            /*
            |--------------------------------------------------------------------------
            | Build Nested Key
            |--------------------------------------------------------------------------
            |
            */
            const fieldKey = parentKey
                ? `${parentKey}.${key}`
                : key

            /*
            |--------------------------------------------------------------------------
            | Ignore Empty Values
            |--------------------------------------------------------------------------
            |
            */
            if (
                value === undefined ||
                value === null
            ) {
                return
            }

            /*
            |--------------------------------------------------------------------------
            | Date Values
            |--------------------------------------------------------------------------
            |
            */
            if (value instanceof Date) {

                formData.append(
                    fieldKey,
                    value.toISOString(),
                )

                return
            }

            /*
            |--------------------------------------------------------------------------
            | Boolean Values
            |--------------------------------------------------------------------------
            |
            */
            if (typeof value === 'boolean') {

                formData.append(
                    fieldKey,
                    value ? '1' : '0',
                )

                return
            }

            /*
            |--------------------------------------------------------------------------
            | File Instance
            |--------------------------------------------------------------------------
            |
            */
            if (value instanceof File) {

                formData.append(
                    fieldKey,
                    value,
                )

                return
            }

            /*
            |--------------------------------------------------------------------------
            | Arrays
            |--------------------------------------------------------------------------
            |
            */
            if (Array.isArray(value)) {

                /*
                |--------------------------------------------------------------------------
                | Ant Design Upload Files
                |--------------------------------------------------------------------------
                |
                | Existing uploaded images from API contain:
                | - uid
                | - url
                | - status
                |
                | Newly uploaded files contain `originFileObj`.
                | We only append real uploaded files.
                |
                */
                if (
                    value?.[0]?.originFileObj ||
                    value?.[0]?.url
                ) {

                    /*
                    |--------------------------------------------------------------------------
                    | Filter Real Uploaded Files
                    |--------------------------------------------------------------------------
                    |
                    */
                    const realFiles = value.filter(
                        (file) => file?.originFileObj,
                    )

                    /*
                    |--------------------------------------------------------------------------
                    | No New Files
                    |--------------------------------------------------------------------------
                    |
                    | Existing API images are only used for preview
                    | and should not be re-uploaded.
                    |
                    */
                    if (!realFiles.length) {
                        return
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Single File
                    |--------------------------------------------------------------------------
                    |
                    */
                    if (realFiles.length === 1) {

                        formData.append(
                            fieldKey,
                            realFiles[0].originFileObj,
                        )

                        return
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Multiple Files
                    |--------------------------------------------------------------------------
                    |
                    */
                    realFiles.forEach((file, index) => {

                        formData.append(
                            `${fieldKey}[${index}]`,
                            file.originFileObj,
                        )
                    })

                    return
                }

                /*
                |--------------------------------------------------------------------------
                | Normal Arrays
                |--------------------------------------------------------------------------
                |
                */
                value.forEach((item, index) => {

                    /*
                    |--------------------------------------------------------------------------
                    | Nested Objects
                    |--------------------------------------------------------------------------
                    |
                    */
                    if (
                        Object.prototype.toString.call(item)
                        === '[object Object]'
                    ) {

                        buildFormData(
                            item,
                            formData,
                            `${fieldKey}[${index}]`,
                        )

                        return
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | File Inside Array
                    |--------------------------------------------------------------------------
                    |
                    */
                    if (item instanceof File) {

                        formData.append(
                            `${fieldKey}[${index}]`,
                            item,
                        )

                        return
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Primitive Values
                    |--------------------------------------------------------------------------
                    |
                    */
                    formData.append(
                        fieldKey,
                        String(item),
                    )
                })

                return
            }

            /*
            |--------------------------------------------------------------------------
            | Nested Objects
            |--------------------------------------------------------------------------
            |
            */
            if (
                Object.prototype.toString.call(value)
                === '[object Object]'
            ) {

                buildFormData(
                    value,
                    formData,
                    fieldKey,
                )

                return
            }

            /*
            |--------------------------------------------------------------------------
            | Primitive Values
            |--------------------------------------------------------------------------
            |
            */
            formData.append(
                fieldKey,
                String(value),
            )
        },
    )

    return formData
}